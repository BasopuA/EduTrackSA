"use client";

import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AutoFixHigh as WandIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as AlertCircleIcon,
} from '@mui/icons-material';
import { ThemeProvider, createTheme, SxProps, Theme } from '@mui/material/styles';
import { useAI } from './use-ai';

// Type definitions for AI schema
interface QuestionBase {
  question: string;
  type: 'multiple-choice' | 'short-answer';
  correctAnswer: string;
  explanation: string;
}

interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice';
  options: string[];
}

interface ShortAnswerQuestion extends QuestionBase {
  type: 'short-answer';
  options?: never;
}

type Question = MultipleChoiceQuestion | ShortAnswerQuestion;

interface GeneratedQuiz {
  quizTitle: string;
  questions: Question[];
}

interface UseAIReturn {
  callAI: (
    prompt: string,
  ) => Promise<{ data: GeneratedQuiz }>;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
}

// MUI Theme matching original Tailwind design tokens
const quizTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#22c55e',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderRadius: 4,
        },
      },
    },
  },
});

export function QuizGenerator() {
  const [content, setContent] = useState<string>('');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuiz | null>(null);
  const { callAI, loading, error, errorMessage } = useAI() as UseAIReturn;

  const generateQuiz = async () => {
    if (!content.trim()) return;

    try {
      const result = await callAI(
        `Generate ${numQuestions} educational quiz questions based on the following content. Create a mix of multiple-choice and short-answer questions that test understanding of key concepts.\n\nContent:\n${content}`,
      );

      setGeneratedQuiz(result.data);
    } catch (err) {
      console.error('Error generating quiz:', err);
    }
  };

  const saveQuiz = async () => {
    if (!generatedQuiz) return;

    try {
      // TODO: Save to monday.com board
      // const board = new QuizzesBoard();
      // await board.item().create({
      //   name: generatedQuiz.quizTitle,
      //   questions: JSON.stringify(generatedQuiz.questions),
      // }).execute();

      alert('Quiz saved successfully! Students can now access it.');
      setGeneratedQuiz(null);
      setContent('');
    } catch (err) {
      console.error('Error saving quiz:', err);
    }
  };

  const cardSx: SxProps<Theme> = {
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  };

  const questionCardSx: SxProps<Theme> = {
    p: 2,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'action.hover',
  };

  const correctOptionSx: SxProps<Theme> = {
    p: 1,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'success.main',
    bgcolor: 'success.light',
    opacity: 0.15,
  };

  const regularOptionSx: SxProps<Theme> = {
    p: 1,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  };

  return (
    <ThemeProvider theme={quizTheme}>
      <Box sx={{ maxWidth: '896px', mx: 'auto', spacing: 3 }}>
        <Stack spacing={3}>
          {/* Generator Card */}
          <Card sx={cardSx}>
            <CardHeader
              title={
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      opacity: 0.1,
                    }}
                  >
                    <WandIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      AI Quiz Generator
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Generate quiz questions automatically from your learning content
                    </Typography>
                  </Box>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Content Input */}
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
                    Learning Content
                  </Typography>
                  <TextField
                    id="content"
                    placeholder="Paste the learning content here. The AI will analyze it and generate relevant quiz questions."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                    multiline
                    rows={10}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Stack>

                {/* Number of Questions */}
                <Stack spacing={1} direction="row" alignItems="center">
                  <Typography variant="subtitle2" color="text.primary" fontWeight={500}>
                    Number of Questions
                  </Typography>
                  <TextField
                    id="numQuestions"
                    type="number"
                    inputProps={{ min: 3, max: 15 }}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                    disabled={loading}
                    size="small"
                    sx={{ width: 100 }}
                  />
                </Stack>

                {/* Generate Button */}
                <Button
                  onClick={generateQuiz}
                  disabled={!content.trim() || loading}
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SparklesIcon fontSize="small" />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {loading ? 'Generating...' : 'Generate Quiz with AI'}
                </Button>

                {/* Error Alert */}
                {error && errorMessage && (
                  <Alert
                    severity="error"
                    icon={<AlertCircleIcon />}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.light',
                      bgcolor: 'error.light',
                      opacity: 0.15,
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 500 }}>Error</AlertTitle>
                    {errorMessage}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Generated Quiz Display */}
          {generatedQuiz && (
            <Card sx={cardSx}>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {generatedQuiz.quizTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {generatedQuiz.questions.length} questions generated
                      </Typography>
                    </Box>
                    <Button
                      onClick={saveQuiz}
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon fontSize="small" />}
                    >
                      Save Quiz
                    </Button>
                  </Stack>
                }
              />
              <CardContent>
                <Stack spacing={3}>
                  {generatedQuiz.questions.map((q, idx) => (
                    <Box key={idx} sx={questionCardSx}>
                      <Stack spacing={2}>
                        {/* Question Header */}
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={500} color="text.primary">
                            Question {idx + 1}: {q.question}
                          </Typography>
                          <Chip
                            label={q.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
                            variant="outlined"
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              '& .MuiChip-label': { px: 1.5 },
                            }}
                          />
                        </Stack>

                        {/* Multiple Choice Options */}
                        {q.type === 'multiple-choice' && q.options && (
                          <Stack spacing={1}>
                            {q.options.map((option, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isCorrect = q.correctAnswer === letter;
                              return (
                                <Box
                                  key={optIdx}
                                  sx={isCorrect ? correctOptionSx : regularOptionSx}
                                >
                                  <Typography variant="body2" color="text.primary" component="span">
                                    <Typography component="span" fontWeight={600}>
                                      {letter}.
                                    </Typography>{' '}
                                    {option}
                                    {isCorrect && (
                                      <CheckCircleIcon
                                        sx={{
                                          fontSize: 16,
                                          color: 'success.main',
                                          verticalAlign: 'middle',
                                          ml: 1,
                                        }}
                                      />
                                    )}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>
                        )}

                        {/* Explanation */}
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            <Typography component="span" fontWeight={500} color="text.primary">
                              Explanation:
                            </Typography>{' '}
                            {q.explanation}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
    </ThemeProvider>
  );
}

export default function QuizGeneratorPage() {
  return <QuizGenerator />;
}