from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from app.database.connection import get_db
from app.schemas.quiz import (
    QuizResponse, QuizUpdate, QuizDetailResponse,
    QuizGenerationRequest, QuizGenerationResponse,
    QuizAttemptStart, QuizAttemptResponse, QuizSubmission,
    QuizResultResponse, QuestionResponse,
    QuizAttemptAutosave, QuizAttemptAutosaveResponse,
    LearnerProgressResponse, LeaderboardItem, TeacherDashboardResponse,
    SchoolAnalyticsResponse,
)
from app.services.ai_quiz_generator import get_ai_generator
from app.models.quiz import Quiz, Question, QuizAttempt, Answer, QuestionType
from app.models.content import Content
from app.models.users import User, UserRole

router = APIRouter(prefix="/quizzes", tags=["Quiz Management"])


def _is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


async def get_current_user_from_token(authorization: str, db: AsyncSession) -> User:
    """Helper to get current user from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "").strip()
    from app.core.security import decode_token
    payload = decode_token(token, token_type="access")
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
    
    return user


def _normalise_question_type(question_type: QuestionType | str) -> QuestionType:
    if isinstance(question_type, QuestionType):
        return question_type
    return QuestionType(question_type)


def _calculate_percentage(score: float, total_marks: float) -> float:
    return round((score / total_marks * 100), 2) if total_marks else 0


@router.post("/generate", response_model=QuizGenerationResponse)
async def generate_quiz_ai(
    request: QuizGenerationRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Generate quiz from content using AI → CSV fallback."""
    
    user = await get_current_user_from_token(authorization, db)
    if user.role not in {UserRole.TEACHER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only teachers can generate quizzes")
    
    result = await db.execute(select(Content).where(Content.id == request.content_id))
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if not content.text_content:
        raise HTTPException(status_code=400, detail="No text content available")
    
    generator = get_ai_generator()
    
    try:
        generated_questions = await generator.generate_quiz(
            content_text=content.text_content,
            num_questions=request.num_questions,
            question_types=request.question_types,
            difficulty=request.difficulty,
            use_csv_fallback=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz generation failed: {str(e)}"
        )
    
    if not generated_questions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No valid questions were generated"
        )
    
    is_csv_fallback = not generator.api_key or len(content.text_content) < 50
    generation_msg = "Quiz generated successfully via CSV fallback" if is_csv_fallback else "Quiz generated successfully with AI"
    
    quiz = Quiz(
        title=f"Quiz: {content.title}",
        description=f"{'CSV' if is_csv_fallback else 'AI'}-generated from {content.title}. Teacher review is required before learners access it.",
        content_id=content.id,
        created_by=user.id,
        is_ai_generated=not is_csv_fallback,
        is_active=False,
        total_marks=len(generated_questions),
        duration_minutes=15
    )
    
    db.add(quiz)
    await db.flush()
    
    for idx, q_data in enumerate(generated_questions):
        question = Question(
            quiz_id=quiz.id,
            question_text=q_data['question_text'],
            question_type=QuestionType(q_data['question_type']),
            marks=1,
            options=q_data.get('options'),
            correct_answer=q_data['correct_answer'],
            explanation=q_data.get('explanation') or "",
            order_index=idx
        )
        db.add(question)
    
    await db.commit()
    await db.refresh(quiz)
    
    return QuizGenerationResponse(
        quiz_id=quiz.id,
        title=quiz.title,
        questions_generated=len(generated_questions),
        message=generation_msg
    )


@router.get("/available", response_model=List[dict])
async def get_available_quizzes(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Learner-facing active quiz list with content metadata."""
    await get_current_user_from_token(authorization, db)
    
    query = (
        select(Quiz, Content)
        .join(Content, Quiz.content_id == Content.id)
        .where(Quiz.is_active == True, Content.is_active == True)
        .order_by(Quiz.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "subject": content.subject,
            "grade": content.grade_level,
            "questions": len(quiz.questions),
            "duration": quiz.duration_minutes or 15,
            "total_marks": quiz.total_marks,
        }
        for quiz, content in rows
    ]


@router.get("/my-attempts", response_model=List[dict])
async def get_my_attempts(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Return completed attempts for the current learner."""
    user = await get_current_user_from_token(authorization, db)
    
    query = (
        select(QuizAttempt, Quiz, Content)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Content, Quiz.content_id == Content.id)
        .where(QuizAttempt.user_id == user.id, QuizAttempt.is_completed == True)
        .order_by(QuizAttempt.completed_at.desc())
        .limit(20)
    )
    result = await db.execute(query)
    
    attempts = []
    for attempt, quiz, content in result.all():
        attempts.append({
            "id": attempt.id,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "subject": content.subject,
            "grade": content.grade_level,
            "score": attempt.score,
            "total_marks": attempt.total_questions,
            "percentage": _calculate_percentage(attempt.score, attempt.total_questions),
            "completed_at": attempt.completed_at,
        })
    
    return attempts


@router.get("/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz_detail(
    quiz_id: int,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz with questions. Teachers see answers; learners do not."""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions_query = select(Question).where(Question.quiz_id == quiz_id).order_by(Question.order_index)
    questions_result = await db.execute(questions_query)
    questions = questions_result.scalars().all()
    
    quiz_detail = QuizDetailResponse.model_validate(quiz)
    
    if _is_admin(user) or quiz.created_by == user.id or user.role == UserRole.TEACHER:
        quiz_detail.questions = [QuestionResponse.model_validate(q) for q in questions]
    else:
        from app.schemas.quiz import QuestionWithoutAnswer
        quiz_detail.questions = [QuestionWithoutAnswer.model_validate(q) for q in questions]
    
    return quiz_detail


@router.put("/{quiz_id}", response_model=QuizDetailResponse)
async def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Teacher review endpoint for editing AI-generated quizzes."""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if user.role not in {UserRole.TEACHER, UserRole.ADMIN} and quiz.created_by != user.id:
        raise HTTPException(status_code=403, detail="Only quiz creators or teachers can review quizzes")
    
    update_data = quiz_update.model_dump(exclude_unset=True)
    questions_update = update_data.pop("questions", None)
    
    for field, value in update_data.items():
        setattr(quiz, field, value)
    
    if quiz_update.questions is not None:
        existing_questions = (
            await db.execute(select(Question).where(Question.quiz_id == quiz.id))
        ).scalars().all()
        existing_by_id = {q.id: q for q in existing_questions}
        incoming_ids = set()
        
        for idx, q_data in enumerate(quiz_update.questions):
            question = existing_by_id.get(q_data.id) if q_data.id else None
            if question:
                if question.quiz_id != quiz.id:
                    raise HTTPException(status_code=404, detail="Question not found in this quiz")
                incoming_ids.add(question.id)
            else:
                question = Question(quiz_id=quiz.id)
                db.add(question)
            
            question.question_text = q_data.question_text
            question.question_type = _normalise_question_type(q_data.question_type)
            question.marks = q_data.marks
            question.options = q_data.options
            question.correct_answer = q_data.correct_answer
            question.explanation = q_data.explanation
            question.order_index = idx
        
        for question in existing_questions:
            if question.id not in incoming_ids:
                await db.delete(question)
    
    quiz.total_marks = sum(q.marks for q in quiz.questions)
    
    await db.commit()
    await db.refresh(quiz)
    
    questions_result = await db.execute(
        select(Question).where(Question.quiz_id == quiz.id).order_by(Question.order_index)
    )
    questions = questions_result.scalars().all()
    quiz_detail = QuizDetailResponse.model_validate(quiz)
    quiz_detail.questions = [QuestionResponse.model_validate(q) for q in questions]
    return quiz_detail


@router.post("/attempts/start", response_model=QuizAttemptResponse)
async def start_quiz_attempt(
    attempt_data: QuizAttemptStart,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Start a quiz attempt"""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(select(Quiz).where(Quiz.id == attempt_data.quiz_id))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="Quiz is not active")
    
    existing = await db.execute(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz.id,
            QuizAttempt.user_id == user.id,
            QuizAttempt.is_completed == True
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Quiz already completed")
    
    count_result = await db.execute(
        select(func.count(Question.id)).where(Question.quiz_id == quiz.id)
    )
    question_count = count_result.scalar() or 0
    
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user.id,
        total_questions=question_count,
        is_completed=False,
        saved_answers={}
    )
    
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    
    return QuizAttemptResponse.model_validate(attempt)


@router.post("/attempts/autosave", response_model=QuizAttemptAutosaveResponse)
async def autosave_quiz_attempt(
    submission: QuizAttemptAutosave,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Auto-save learner answers for unreliable connectivity."""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == submission.attempt_id)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to save this attempt")
    
    attempt.saved_answers = {
        str(answer.question_id): answer.answer_text for answer in submission.answers
    }
    await db.commit()
    await db.refresh(attempt)
    
    return QuizAttemptAutosaveResponse(
        attempt_id=attempt.id,
        saved_answers=len(attempt.saved_answers or {}),
        updated_at=datetime.now(timezone.utc)
    )


@router.post("/attempts/submit", response_model=QuizResultResponse)
async def submit_quiz_attempt(
    submission: QuizSubmission,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Submit quiz answers and get results"""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == submission.attempt_id)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this attempt"
        )
    
    if attempt.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This attempt has already been submitted"
        )
    
    correct_count = 0
    total_marks = 0.0
    marks_obtained = 0.0
    answers_response = []
    
    for answer_data in submission.answers:
        q_result = await db.execute(
            select(Question).where(Question.id == answer_data.question_id)
        )
        question = q_result.scalar_one_or_none()
        
        if not question:
            continue
        
        is_correct = False
        marks = 0.0
        
        if question.question_type in (QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE):
            is_correct = answer_data.answer_text.strip().lower() == question.correct_answer.strip().lower()
        elif question.question_type == QuestionType.SHORT_ANSWER:
            is_correct = answer_data.answer_text.strip().lower() in question.correct_answer.strip().lower()
        
        if is_correct:
            correct_count += 1
            marks = question.marks
            marks_obtained += marks
        
        total_marks += question.marks
        
        answer = Answer(
            attempt_id=attempt.id,
            question_id=question.id,
            answer_text=answer_data.answer_text,
            is_correct=is_correct,
            marks_obtained=marks
        )
        db.add(answer)
        answers_response.append({
            "question_id": question.id,
            "answer_text": answer_data.answer_text,
            "is_correct": is_correct,
            "marks_obtained": marks,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
        })
    
    attempt.score = marks_obtained
    attempt.correct_answers = correct_count
    attempt.is_completed = True
    attempt.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(attempt)
    
    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_title=attempt.quiz.title,
        score=attempt.score,
        total_marks=total_marks,
        percentage=_calculate_percentage(attempt.score, total_marks),
        correct_answers=attempt.correct_answers,
        total_questions=attempt.total_questions,
        completed_at=attempt.completed_at,
        answers=answers_response
    )


@router.get("/attempts/{attempt_id}", response_model=QuizResultResponse)
async def get_attempt_result(
    attempt_id: int,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz attempt results"""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == attempt_id)
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.user_id != user.id and not _is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this attempt"
        )
    
    if not attempt.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz attempt not yet completed"
        )
    
    total_marks = sum(q.marks for q in attempt.quiz.questions)
    
    return QuizResultResponse(
        attempt_id=attempt.id,
        quiz_title=attempt.quiz.title,
        score=attempt.score,
        total_marks=total_marks,
        percentage=_calculate_percentage(attempt.score, total_marks),
        correct_answers=attempt.correct_answers,
        total_questions=attempt.total_questions,
        completed_at=attempt.completed_at
    )


@router.get("/learner/progress", response_model=LearnerProgressResponse)
async def get_learner_progress(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Gamification progress: points, streaks, average score."""
    user = await get_current_user_from_token(authorization, db)
    
    result = await db.execute(
        select(QuizAttempt).where(
            QuizAttempt.user_id == user.id,
            QuizAttempt.is_completed == True
        )
    )
    attempts = result.scalars().all()
    
    points = 0
    completed_dates = set()
    for attempt in attempts:
        percentage = _calculate_percentage(attempt.score, attempt.total_questions)
        points += int(max(0, percentage))
        if attempt.completed_at:
            completed_dates.add(attempt.completed_at.date())
    
    streak_days = _calculate_streak(completed_dates)
    average_score = sum(_calculate_percentage(a.score, a.total_questions) for a in attempts) / len(attempts) if attempts else 0.0
    last_quiz_date = max((a.completed_at for a in attempts if a.completed_at), default=None)
    
    return LearnerProgressResponse(
        user_id=user.id,
        points=points,
        streak_days=streak_days,
        quizzes_completed=len(attempts),
        average_score=round(average_score, 2),
        last_quiz_date=last_quiz_date
    )


@router.get("/leaderboard", response_model=List[LeaderboardItem])
async def get_leaderboard(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Top learner leaderboard by points."""
    await get_current_user_from_token(authorization, db)
    
    users_result = await db.execute(select(User).where(User.role == UserRole.USER))
    users = users_result.scalars().all()
    
    leaderboard = []
    for learner in users:
        attempts_result = await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.user_id == learner.id,
                QuizAttempt.is_completed == True
            )
        )
        attempts = attempts_result.scalars().all()
        completed_dates = {a.completed_at.date() for a in attempts if a.completed_at}
        points = sum(int(_calculate_percentage(a.score, a.total_questions)) for a in attempts)
        average_score = sum(_calculate_percentage(a.score, a.total_questions) for a in attempts) / len(attempts) if attempts else 0.0
        leaderboard.append(
            LeaderboardItem(
                user_id=learner.id,
                username=learner.username,
                full_name=learner.full_name,
                points=points,
                streak_days=_calculate_streak(completed_dates),
                quizzes_completed=len(attempts),
                average_score=round(average_score, 2)
            )
        )
    
    return sorted(leaderboard, key=lambda item: (item.points, item.streak_days), reverse=True)[:10]


@router.get("/teacher/dashboard", response_model=TeacherDashboardResponse)
async def get_teacher_dashboard(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Teacher dashboard analytics and at-risk learner flagging."""
    user = await get_current_user_from_token(authorization, db)
    if user.role not in {UserRole.TEACHER, UserRole.ADMIN}:
        raise HTTPException(status_code=403, detail="Only teachers can access teacher analytics")
    
    learner_ids_result = await db.execute(select(User.id).where(User.role == UserRole.USER))
    learner_ids = set(learner_ids_result.scalars().all())
    
    attempts_result = await db.execute(
        select(QuizAttempt, Quiz, Content, User)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Content, Quiz.content_id == Content.id)
        .join(User, QuizAttempt.user_id == User.id)
        .where(QuizAttempt.is_completed == True, QuizAttempt.user_id.in_(learner_ids))
        .order_by(QuizAttempt.completed_at.desc())
    )
    rows = attempts_result.all()
    
    learner_scores = defaultdict(list)
    recent_submissions = []
    for attempt, quiz, content, learner in rows:
        percentage = _calculate_percentage(attempt.score, attempt.total_questions)
        learner_scores[learner.id].append(percentage)
        if len(recent_submissions) < 10:
            recent_submissions.append({
                "student": learner.username,
                "quiz": quiz.title,
                "score": round(percentage, 2),
                "time": attempt.completed_at.isoformat() if attempt.completed_at else None,
            })
    
    at_risk = []
    for learner_id, scores in learner_scores.items():
        learner = await db.get(User, learner_id)
        if learner and len(scores) >= 2 and sum(scores) / len(scores) < 50:
            at_risk.append({
                "user_id": learner.id,
                "username": learner.username,
                "average_score": round(sum(scores) / len(scores), 2),
                "quiz_count": len(scores),
            })
    
    active_students = len({attempt.user_id for attempt, _, _, _ in rows if attempt.completed_at and attempt.completed_at >= datetime.utcnow() - timedelta(days=30)})
    completion_rate = (len(rows) / max(1, len(learner_ids))) * 100
    average_score = sum(_calculate_percentage(a.score, a.total_questions) for a, _, _, _ in rows) / len(rows) if rows else 0
    
    return TeacherDashboardResponse(
        total_students=len(learner_ids),
        active_students=active_students,
        average_score=round(average_score, 2),
        completion_rate=round(completion_rate, 2),
        at_risk_students=len(at_risk),
        recent_submissions=recent_submissions,
        at_risk_learners=at_risk
    )


@router.get("/analytics/school", response_model=SchoolAnalyticsResponse)
async def get_school_analytics(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """School management analytics endpoint."""
    user = await get_current_user_from_token(authorization, db)
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Only school management can access school analytics")
    
    total_students = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.USER))).scalar_one()
    active_students = (
        await db.execute(
            select(func.count(distinct(QuizAttempt.user_id))).where(
                QuizAttempt.is_completed == True,
                QuizAttempt.completed_at >= datetime.utcnow() - timedelta(days=30)
            )
        )
    ).scalar_one()
    total_teachers = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.TEACHER))).scalar_one()
    total_quizzes = (await db.execute(select(func.count(Quiz.id)))).scalar_one()
    
    attempts_result = await db.execute(
        select(QuizAttempt, Quiz, Content)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(Content, Quiz.content_id == Content.id)
        .where(QuizAttempt.is_completed == True)
        .order_by(QuizAttempt.completed_at.desc())
    )
    rows = attempts_result.all()
    average_score = sum(_calculate_percentage(a.score, a.total_questions) for a, _, _ in rows) / len(rows) if rows else 0
    completion_rate = (len(rows) / max(1, total_students)) * 100
    
    monthly_counts = defaultdict(int)
    subject_scores = defaultdict(list)
    for attempt, quiz, content in rows:
        if attempt.completed_at:
            month_key = attempt.completed_at.strftime("%Y-%m")
            monthly_counts[month_key] += 1
        subject_scores[content.subject or "Uncategorised"].append(_calculate_percentage(attempt.score, attempt.total_questions))
    
    engagement_trend = [
        {"month": month, "students": count}
        for month, count in sorted(monthly_counts.items())[-6:]
    ]
    performance_by_subject = [
        {"subject": subject, "avg": round(sum(scores) / len(scores), 2)}
        for subject, scores in sorted(subject_scores.items())
    ]
    
    return SchoolAnalyticsResponse(
        total_students=total_students,
        active_students=active_students,
        total_teachers=total_teachers,
        total_quizzes=total_quizzes,
        average_score=round(average_score, 2),
        completion_rate=round(completion_rate, 2),
        engagement_trend=engagement_trend,
        performance_by_subject=performance_by_subject
    )


def _calculate_streak(dates: set) -> int:
    if not dates:
        return 0
    
    today = datetime.now(timezone.utc).date()
    streak = 0
    current = today
    
    while current in dates:
        streak += 1
        current -= timedelta(days=1)
    
    if streak == 0 and today - timedelta(days=1) in dates:
        current = today - timedelta(days=1)
        while current in dates:
            streak += 1
            current -= timedelta(days=1)
    
    return streak
