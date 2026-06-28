"use client";

import { useCallback, useState } from "react";

export interface GeneratedQuiz {
  quizTitle: string;
  questions: Array<{
    question: string;
    type: "multiple-choice" | "short-answer";
    correctAnswer: string;
    explanation: string;
    options?: string[];
  }>;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const callAI = useCallback(
    async (prompt: string) => {
      setLoading(true);
      setError(false);
      setErrorMessage(undefined);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const contentSeed = prompt.trim().slice(0, 80);
        const generatedQuiz: GeneratedQuiz = {
          quizTitle: contentSeed ? `Generated Quiz: ${contentSeed}` : "Generated Practice Quiz",
          questions: [
            {
              question: "Which statement best describes the main concept from the provided content?",
              type: "multiple-choice",
              options: [
                "The first option summarises the concept accurately",
                "A partially related but incomplete statement",
                "A statement that applies to a different topic",
                "A statement with no supporting evidence",
              ],
              correctAnswer: "A",
              explanation: "The correct answer is the option that most accurately reflects the key concept in the learning content.",
            },
            {
              question: "Explain one key takeaway from the learning content in your own words.",
              type: "short-answer",
              correctAnswer: "key takeaway",
              explanation: "A strong short answer should identify a key idea, definition, or process from the content.",
            },
          ],
        };

        return { data: generatedQuiz };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate quiz.";
        setError(true);
        setErrorMessage(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { callAI, loading, error, errorMessage };
}
