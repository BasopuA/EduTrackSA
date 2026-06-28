"use client";

import React, { useState, useEffect } from 'react';
import Grid from '../../components/ui/grid';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';

import {
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  LogOut,
  Award,
  ClipboardList,
} from 'lucide-react';

import { QuizTaker } from '../QuizTaker/page';

interface StudentDashboardProps {
  onLogout: () => void;
  user: { full_name?: string | null; username: string } | null;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  grade: string;
  questions: number;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface CompletedQuiz extends Quiz {
  score: number;
  correct: number;
  total: number;
}

interface QuizResult {
  score: number;
  correct: number;
  total: number;
}

export function StudentDashboard({
  onLogout,
  user,
}: StudentDashboardProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const [completedQuizzes, setCompletedQuizzes] = useState<
    CompletedQuiz[]
  >([]);

  // Mock available quizzes
  const availableQuizzes: Quiz[] = [
    {
      id: '1',
      title: 'Mathematics - Algebra Basics',
      subject: 'Mathematics',
      grade: 'Grade 10',
      questions: 10,
      duration: 15,
      difficulty: 'Medium',
    },
    {
      id: '2',
      title: "Physical Sciences - Newton's Laws",
      subject: 'Physical Sciences',
      grade: 'Grade 11',
      questions: 8,
      duration: 12,
      difficulty: 'Hard',
    },
    {
      id: '3',
      title: 'Life Sciences - Cell Structure',
      subject: 'Life Sciences',
      grade: 'Grade 10',
      questions: 12,
      duration: 20,
      difficulty: 'Easy',
    },
  ];

  const stats = {
    completed: completedQuizzes.length,
    average:
      completedQuizzes.length > 0
        ? Math.round(
            completedQuizzes.reduce(
              (sum, q) => sum + q.score,
              0
            ) / completedQuizzes.length
          )
        : 0,
    streak: 5,
  };

  if (selectedQuiz) {
    return (
      <QuizTaker
        quiz={selectedQuiz}
        onComplete={(result: QuizResult) => {
          setCompletedQuizzes([
            ...completedQuizzes,
            { ...selectedQuiz, ...result },
          ]);

          setSelectedQuiz(null);
        }}
        onExit={() => setSelectedQuiz(null)}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* HEADER */}
      <Box
        sx={{
          borderBottom: '1px solid #ddd',
          bgcolor: 'white',
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: 'auto',
            px: 2,
            py: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <BookOpen />

              <Box>
                <Typography variant="h6">
                  Student Dashboard
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Your Learning Hub
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user?.full_name
                  ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : user?.username?.slice(0, 2).toUpperCase() || 'U'}
              </Box>
              <Button
                variant="outlined"
                startIcon={<LogOut size={16} />}
                onClick={onLogout}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          p: 2,
        }}
      >
        {/* STATS */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <CheckCircle2 color="green" />

                  <Box>
                    <Typography variant="h5">
                      {stats.completed}
                    </Typography>

                    <Typography variant="body2">
                      Quizzes Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <TrendingUp color="blue" />

                  <Box>
                    <Typography variant="h5">
                      {stats.average}%
                    </Typography>

                    <Typography variant="body2">
                      Average Score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Award color="orange" />

                  <Box>
                    <Typography variant="h5">
                      {stats.streak}
                    </Typography>

                    <Typography variant="body2">
                      Day Streak
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* QUIZZES */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Available Quizzes
          </Typography>

          <Grid container spacing={2}>
            {availableQuizzes.map((quiz) => (
              <Grid size={{ xs: 12, md: 4 }} key={quiz.id}>
                <Card>
                  <CardHeader
                    title={quiz.title}
                    subheader={quiz.grade}
                  />

                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={quiz.subject}
                        variant="outlined"
                      />

                      <Chip
                        label={quiz.difficulty}
                        color={
                          quiz.difficulty === 'Easy'
                            ? 'success'
                            : quiz.difficulty === 'Medium'
                            ? 'warning'
                            : 'error'
                        }
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <ClipboardList size={16} />
                        <Typography variant="body2">
                          {quiz.questions} Questions
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Clock size={16} />
                        <Typography variant="body2">
                          {quiz.duration} min
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() =>
                        setSelectedQuiz(quiz)
                      }
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* RECENT RESULTS */}
        {completedQuizzes.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Results
            </Typography>

            <Card>
              <CardContent>
                {completedQuizzes
                  .slice(-5)
                  .reverse()
                  .map((quiz, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        py: 2,
                        borderBottom:
                          idx !==
                          completedQuizzes.length - 1
                            ? '1px solid #eee'
                            : 'none',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography fontWeight={600}>
                            {quiz.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {quiz.subject} •{' '}
                            {quiz.grade}
                          </Typography>
                        </Box>

                        <Box textAlign="right">
                          <Typography variant="h6">
                            {quiz.score}%
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {quiz.correct}/
                            {quiz.total} correct
                          </Typography>
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={quiz.score}
                      />
                    </Box>
                  ))}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function LearnerDashboardPage() {
  const [user, setUser] = useState<{ full_name?: string | null; username: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = window.localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
    }
    window.location.href = "/login";
  };

  return (
    <StudentDashboard
      user={user}
      onLogout={handleLogout}
    />
  );
}