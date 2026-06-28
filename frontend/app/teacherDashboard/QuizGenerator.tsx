"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Wand2, Sparkles, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { useAI } from '../QuizGenerator/use-ai';

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
      alert('Quiz saved successfully! Students can now access it.');
      setGeneratedQuiz(null);
      setContent('');
    } catch (err) {
      console.error('Error saving quiz:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Generator Card */}
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Quiz Generator</CardTitle>
              <CardDescription className="mt-1">
                Generate quiz questions automatically from your learning content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Learning Content
            </Label>
            <Textarea
              id="content"
              placeholder="Paste the learning content here. The AI will analyze it and generate relevant quiz questions."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              rows={10}
              className="resize-y min-h-[120px]"
            />
          </div>

          {/* Number of Questions */}
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="numQuestions" className="text-sm font-medium">
              Number of Questions
            </Label>
            <Input
              id="numQuestions"
              type="number"
              min={3}
              max={15}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              disabled={loading}
              className="h-11"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateQuiz}
            disabled={!content.trim() || loading}
            className="gap-2 h-11 px-6"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Quiz with AI
              </>
            )}
          </Button>

          {/* Error Alert */}
          {error && errorMessage && (
            <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Error</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Quiz Display */}
      {generatedQuiz && (
        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{generatedQuiz.quizTitle}</CardTitle>
                <CardDescription>
                  {generatedQuiz.questions.length} questions generated
                </CardDescription>
              </div>
              <Button
                onClick={saveQuiz}
                className="gap-2 h-10 bg-success hover:bg-success/90 text-success-foreground"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedQuiz.questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium text-foreground">
                    Question {idx + 1}: {q.question}
                  </h4>
                  <Badge variant={q.type === 'multiple-choice' ? 'default' : 'secondary'}>
                    {q.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
                  </Badge>
                </div>

                {/* Multiple Choice Options */}
                {q.type === 'multiple-choice' && q.options && (
                  <div className="space-y-2 pl-2">
                    {q.options.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = q.correctAnswer === letter;
                      return (
                        <div
                          key={optIdx}
                          className={[
                            "flex items-center justify-between p-2.5 rounded-md border",
                            isCorrect
                              ? "border-success/30 bg-success/10"
                              : "border-border bg-background",
                          ].filter(Boolean).join(" ")}
                        >
                          <span className="text-sm">
                            <span className="font-semibold">{letter}.</span> {option}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                <div className="p-3 rounded-md border border-border bg-background">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Explanation:</span>{' '}
                    {q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function QuizGeneratorPage() {
  return <QuizGenerator />;
}
