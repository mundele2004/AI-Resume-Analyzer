"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  InterviewAnswerRecord,
  InterviewEvaluation,
  InterviewQuestion,
  InterviewSetupValues,
  InterviewSummary,
  MockInterviewContext,
} from "@/types/interview";

type InterviewPhase = "setup" | "generating" | "active" | "summarizing" | "complete";

type ApiErrorResponse = {
  success: false;
  error?: string;
};

type GenerateResponse =
  | { success: true; questions: InterviewQuestion[] }
  | ApiErrorResponse;

type EvaluateResponse =
  | { success: true; evaluation: InterviewEvaluation }
  | ApiErrorResponse;

type SummaryResponse =
  | { success: true; summary: InterviewSummary }
  | ApiErrorResponse;

function createLocalSummary(records: InterviewAnswerRecord[]): InterviewSummary {
  const evaluated = records.filter((record) => record.evaluation);
  const average =
    evaluated.length > 0
      ? Math.round(
          (evaluated.reduce(
            (total, record) => total + (record.evaluation?.score ?? 0),
            0
          ) /
            evaluated.length) *
            10
        )
      : 0;
  const technicalScores = evaluated.filter(
    (record) => record.question.type === "technical"
  );
  const behavioralScores = evaluated.filter(
    (record) => record.question.type === "behavioral"
  );
  const technicalAverage =
    technicalScores.length > 0
      ? Math.round(
          (technicalScores.reduce(
            (total, record) => total + (record.evaluation?.score ?? 0),
            0
          ) /
            technicalScores.length) *
            10
        )
      : average;
  const behavioralAverage =
    behavioralScores.length > 0
      ? Math.round(
          (behavioralScores.reduce(
            (total, record) => total + (record.evaluation?.score ?? 0),
            0
          ) /
            behavioralScores.length) *
            10
        )
      : average;

  return {
    overallScore: average,
    technicalScore: technicalAverage,
    communicationScore: average,
    behavioralScore: behavioralAverage,
    strengths: evaluated.flatMap((record) => record.evaluation?.strengths ?? []).slice(0, 5),
    weaknesses: evaluated.flatMap((record) => record.evaluation?.weaknesses ?? []).slice(0, 5),
    recommendedTopics: evaluated
      .flatMap((record) => record.evaluation?.improvements ?? [])
      .slice(0, 5),
    nextSteps: [
      "Review ideal answers for missed details.",
      "Practice answering the weakest question type again.",
      "Add clearer project impact and role-specific keywords to the resume.",
    ],
  };
}

function withDefaultMode(values: InterviewSetupValues): InterviewSetupValues {
  return {
    ...values,
    mode: values.mode ?? "Text Interview",
  };
}

export function useInterview(context: MockInterviewContext | null) {
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [setup, setSetup] = useState<InterviewSetupValues | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<InterviewAnswerRecord[]>([]);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = records.filter((record) => !record.skipped).length;
  const skippedCount = records.filter((record) => record.skipped).length;
  const progress = questions.length
    ? Math.min(100, Math.round((records.length / questions.length) * 100))
    : 0;
  const resolvedRole = useMemo(() => {
    if (!setup) {
      return "";
    }

    return setup.role === "Custom Role" ? setup.customRole.trim() : setup.role;
  }, [setup]);

  const startInterview = useCallback(
    async (values: InterviewSetupValues) => {
      if (!context) {
        setError("Analyze a resume before starting a mock interview.");
        return;
      }

      const role = values.role === "Custom Role" ? values.customRole.trim() : values.role;

      if (!role) {
        setError("Enter a custom role before starting.");
        return;
      }

      setPhase("generating");
      setSetup(withDefaultMode(values));
      setError(null);
      setSummary(null);
      setRecords([]);
      setCurrentIndex(0);

      try {
        const response = await fetch("/api/generate-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            role: values.role,
            customRole: values.customRole,
            difficulty: values.difficulty,
            duration: values.duration,
          }),
        });
        const payload = (await response.json()) as GenerateResponse;

        if (!payload.success) {
          throw new Error(payload.error ?? "Unable to generate interview questions.");
        }

        setQuestions(payload.questions);
        setPhase("active");
      } catch (generationError) {
        setError(
          generationError instanceof Error
            ? generationError.message
            : "Unable to generate interview questions."
        );
        setPhase("setup");
      }
    },
    [context]
  );

  const summarize = useCallback(
    async (nextRecords: InterviewAnswerRecord[]) => {
      if (!context || !setup) {
        setSummary(createLocalSummary(nextRecords));
        setPhase("complete");
        return;
      }

      setPhase("summarizing");
      setError(null);

      try {
        const response = await fetch("/api/interview-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            role: resolvedRole,
            difficulty: setup.difficulty,
            records: nextRecords,
          }),
        });
        const payload = (await response.json()) as SummaryResponse;

        if (!payload.success) {
          throw new Error(payload.error ?? "Unable to summarize interview.");
        }

        setSummary(payload.summary);
      } catch (summaryError) {
        setError(
          summaryError instanceof Error
            ? summaryError.message
            : "Unable to summarize interview."
        );
        setSummary(createLocalSummary(nextRecords));
      } finally {
        setPhase("complete");
      }
    },
    [context, resolvedRole, setup]
  );

  const moveNext = useCallback(
    async (nextRecords: InterviewAnswerRecord[], nextQuestions = questions) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= nextQuestions.length) {
        await summarize(nextRecords);
        return;
      }

      setCurrentIndex(nextIndex);
      setPhase("active");
    },
    [currentIndex, questions, summarize]
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!context || !setup || !currentQuestion || isEvaluating) {
        return;
      }

      if (!answer.trim()) {
        setError("Write an answer before submitting.");
        return;
      }

      setIsEvaluating(true);
      setError(null);

      try {
        const response = await fetch("/api/evaluate-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            question: currentQuestion,
            answer,
            role: resolvedRole,
            difficulty: setup.difficulty,
          }),
        });
        const payload = (await response.json()) as EvaluateResponse;

        if (!payload.success) {
          throw new Error(payload.error ?? "Unable to evaluate this answer.");
        }

        const nextRecords = [
          ...records,
          {
            question: currentQuestion,
            answer: answer.trim(),
            evaluation: payload.evaluation,
            skipped: false,
          },
        ];
        const canAddFollowUp =
          payload.evaluation.followUpQuestion &&
          (currentQuestion.followUpDepth ?? 0) < 2;
        const nextQuestions = canAddFollowUp
          ? [
              ...questions.slice(0, currentIndex + 1),
              {
                id: `${currentQuestion.id}-follow-up-${(currentQuestion.followUpDepth ?? 0) + 1}`,
                type: currentQuestion.type,
                question: payload.evaluation.followUpQuestion ?? "",
                source: "AI follow-up",
                followUpDepth: (currentQuestion.followUpDepth ?? 0) + 1,
                parentQuestionId:
                  currentQuestion.parentQuestionId ?? currentQuestion.id,
              },
              ...questions.slice(currentIndex + 1),
            ]
          : questions;

        setRecords(nextRecords);
        setQuestions(nextQuestions);
        await moveNext(nextRecords, nextQuestions);
      } catch (evaluationError) {
        setError(
          evaluationError instanceof Error
            ? evaluationError.message
            : "Unable to evaluate this answer."
        );
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      context,
      currentIndex,
      currentQuestion,
      isEvaluating,
      moveNext,
      questions,
      records,
      resolvedRole,
      setup,
    ]
  );

  const skipQuestion = useCallback(async () => {
    if (!currentQuestion) {
      return;
    }

    const nextRecords = [
      ...records,
      {
        question: currentQuestion,
        answer: "",
        evaluation: null,
        skipped: true,
      },
    ];

    setRecords(nextRecords);
    await moveNext(nextRecords);
  }, [currentQuestion, moveNext, records]);

  const endInterview = useCallback(async () => {
    await summarize(records);
  }, [records, summarize]);

  const resetInterview = useCallback(() => {
    setPhase("setup");
    setSetup(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRecords([]);
    setSummary(null);
    setError(null);
    setIsEvaluating(false);
  }, []);

  return {
    phase,
    setup,
    questions,
    currentQuestion,
    currentIndex,
    records,
    summary,
    error,
    progress,
    answeredCount,
    skippedCount,
    isEvaluating,
    resolvedRole,
    startInterview,
    submitAnswer,
    skipQuestion,
    endInterview,
    resetInterview,
  };
}
