"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Chip,
  LinearProgress,
  Typography,
  Box,
  Grid,
} from '@mui/material';

import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Award,
} from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  duration: number;
}

interface QuizResult {
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
}

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

interface Question {
  id: number;
  question: string;
  type: 'multiple-choice' | 'short-answer';
  options?: string[];
  correctAnswer: number | string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'What is the quadratic formula?',
    type: 'multiple-choice',
    options: [
      'x = -b ± √(b² - 4ac) / 2a',
      'x = -b ± √(b² + 4ac) / 2a',
      'x = b ± √(b² - 4ac) / 2a',
      'x = -b ± √(b² - 4ac) / a',
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: 'Solve for x: 2x + 5 = 13',
    type: 'multiple-choice',
    options: ['x = 4', 'x = 8', 'x = 9', 'x = 6'],
    correctAnswer: 0,
  },
  {
    id: 3,
    question: 'What is a binomial?',
    type: 'short-answer',
    correctAnswer: 'polynomial with two terms',
  },
];

export function QuizTaker({
  quiz,
  onComplete,
  onExit,
}: QuizTakerProps) {
  const [currentQuestion, setCurrentQuestion] =
    useState<number>(0);

  const [answers, setAnswers] = useState<
    Record<number, string | number>
  >({});

  const [timeLeft, setTimeLeft] = useState<number>(
    quiz.duration * 60
  );

  const [submitted, setSubmitted] =
    useState<boolean>(false);

  const [results, setResults] =
    useState<QuizResult | null>(null);

  const handleSubmit = useCallback(() => {
    const correct = questions.filter((q, idx) => {
      const answer = answers[idx];

      if (q.type === 'multiple-choice') {
        return answer === q.correctAnswer;
      }

      return String(answer)
        .toLowerCase()
        .includes(
          String(q.correctAnswer).toLowerCase()
        );
    }).length;

    const score = Math.round(
      (correct / questions.length) * 100
    );

    const result: QuizResult = {
      score,
      correct,
      total: questions.length,
      timeTaken: quiz.duration * 60 - timeLeft,
    };

    setResults(result);

    setSubmitted(true);
  }, [answers, timeLeft, quiz.duration]);

  const latestSubmit = useRef(handleSubmit);

  useEffect(() => {
    latestSubmit.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          latestSubmit.current();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted]);

  const handleFinish = () => {
    if (results) {
      onComplete(results);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // RESULTS SCREEN
  if (submitted && results) {
    const passed = results.score >= 50;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 700 }}>
          <CardHeader
            title={
              <Box textAlign="center">
                <Box mb={2}>
                  {passed ? (
                    <Award
                      size={60}
                      color="#2e7d32"
                    />
                  ) : (
                    <XCircle
                      size={60}
                      color="#d32f2f"
                    />
                  )}
                </Box>

                <Typography variant="h4">
                  {passed
                    ? 'Great Job!'
                    : 'Keep Practicing!'}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {quiz.title}
                </Typography>
              </Box>
            }
          />

          <CardContent>
            <Grid container spacing={2} >
              <Grid >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h4"
                      align="center"
                    >
                      {results.score}%
                    </Typography>

                    <Typography
                      variant="body2"
                      align="center"
                    >
                      Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h4"
                      align="center"
                    >
                      {results.correct}/
                      {results.total}
                    </Typography>

                    <Typography
                      variant="body2"
                      align="center"
                    >
                      Correct
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid >
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="h4"
                      align="center"
                    >
                      {formatTime(
                        results.timeTaken
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      align="center"
                    >
                      Time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box mt={4}>
              <Typography
                variant="body2"
                gutterBottom
              >
                Performance
              </Typography>

              <LinearProgress
                variant="determinate"
                value={results.score}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 4 }}
              onClick={handleFinish}
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const progress =
    ((currentQuestion + 1) / questions.length) *
    100;

  const question = questions[currentQuestion];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          borderBottom: '1px solid #ddd',
          bgcolor: 'white',
          p: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={onExit}
          >
            Exit Quiz
          </Button>

          <Box
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Clock size={18} />

            <Typography
              color={
                timeLeft < 60
                  ? 'error'
                  : 'text.primary'
              }
            >
              {formatTime(timeLeft)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          p: 3,
        }}
      >
        {/* PROGRESS */}
        <Box mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="body2">
              Question {currentQuestion + 1} of{' '}
              {questions.length}
            </Typography>

            <Typography variant="body2">
              {Math.round(progress)}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
          />
        </Box>

        {/* QUESTION */}
        <Card>
          <CardHeader
            title={
              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
              >
                <Typography variant="h5">
                  {question.question}
                </Typography>

                <Chip
                  label={
                    question.type ===
                    'multiple-choice'
                      ? 'Multiple Choice'
                      : 'Short Answer'
                  }
                />
              </Box>
            }
          />

          <CardContent>
            {question.type ===
            'multiple-choice' ? (
              <Box>
                {question.options?.map(
                  (option, idx) => (
                    <Box
                      key={idx}
                      onClick={() =>
                        setAnswers({
                          ...answers,
                          [currentQuestion]:
                            idx,
                        })
                      }
                      sx={{
                        p: 2,
                        mb: 2,
                        border:
                          answers[
                            currentQuestion
                          ] === idx
                            ? '2px solid #1976d2'
                            : '1px solid #ddd',
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor:
                          answers[
                            currentQuestion
                          ] === idx
                            ? '#e3f2fd'
                            : 'white',
                        transition:
                          'all 0.2s ease',
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                      >
                        {answers[
                          currentQuestion
                        ] === idx && (
                          <CheckCircle2
                            color="#1976d2"
                            size={18}
                          />
                        )}

                        <Typography>
                          {option}
                        </Typography>
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            ) : (
              <TextField
                fullWidth
                placeholder="Type your answer here..."
                value={
                  answers[currentQuestion] ||
                  ''
                }
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    [currentQuestion]:
                      e.target.value,
                  })
                }
              />
            )}

            {/* NAVIGATION */}
            <Box
              display="flex"
              justifyContent="space-between"
              mt={4}
            >
              <Button
                variant="outlined"
                disabled={
                  currentQuestion === 0
                }
                onClick={() =>
                  setCurrentQuestion(
                    currentQuestion - 1
                  )
                }
              >
                Previous
              </Button>

              {currentQuestion ===
              questions.length - 1 ? (
                <Button
                  variant="contained"
                  startIcon={
                    <CheckCircle2
                      size={16}
                    />
                  }
                  onClick={handleSubmit}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() =>
                    setCurrentQuestion(
                      currentQuestion + 1
                    )
                  }
                >
                  Next
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default function QuizTakerPage() {
  return (
    <QuizTaker
      quiz={{ id: "demo", title: "Demo Quiz", duration: 15 }}
      onComplete={() => undefined}
      onExit={() => undefined}
    />
  );
}