"use client";

import { useCallback, useMemo, useState } from "react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type {
  InterviewAnswerRecord,
  InterviewEvaluation,
  InterviewQuestion,
  MockInterviewContext,
} from "@/types/interview";
import type {
  VoiceInterviewPhase,
  VoiceInterviewSummary,
  VoiceSetupValues,
} from "@/types/voice-interview";

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
  | { success: true; summary: Omit<VoiceInterviewSummary, "confidenceScore"> }
  | ApiErrorResponse;

function createLocalVoiceSummary(
  records: InterviewAnswerRecord[]
): VoiceInterviewSummary {
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
  const technical = evaluated.filter(
    (record) => record.question.type === "technical"
  );
  const behavioral = evaluated.filter(
    (record) => record.question.type === "behavioral"
  );
  const confidencePenalty = Math.min(25, records.filter((record) => record.skipped).length * 8);

  return {
    overallScore: average,
    technicalScore:
      technical.length > 0
        ? Math.round(
            (technical.reduce(
              (total, record) => total + (record.evaluation?.score ?? 0),
              0
            ) /
              technical.length) *
              10
          )
        : average,
    communicationScore: average,
    behavioralScore:
      behavioral.length > 0
        ? Math.round(
            (behavioral.reduce(
              (total, record) => total + (record.evaluation?.score ?? 0),
              0
            ) /
              behavioral.length) *
              10
          )
        : average,
    confidenceScore: Math.max(0, average - confidencePenalty),
    strengths: evaluated.flatMap((record) => record.evaluation?.strengths ?? []).slice(0, 5),
    weaknesses: evaluated.flatMap((record) => record.evaluation?.weaknesses ?? []).slice(0, 5),
    recommendedTopics: evaluated
      .flatMap((record) => record.evaluation?.improvements ?? [])
      .slice(0, 5),
    nextSteps: [
      "Practice concise spoken answers with a clear beginning, evidence, and close.",
      "Review the ideal answers and rerecord your weakest responses.",
      "Prepare project stories that explain architecture, tradeoffs, and measurable impact.",
    ],
  };
}

export function useVoiceInterview(context: MockInterviewContext | null) {
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();
  const [phase, setPhase] = useState<VoiceInterviewPhase>("setup");
  const [setup, setSetup] = useState<VoiceSetupValues | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<InterviewAnswerRecord[]>([]);
  const [latestEvaluation, setLatestEvaluation] =
    useState<InterviewEvaluation | null>(null);
  const [summary, setSummary] = useState<VoiceInterviewSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualTranscript, setManualTranscript] = useState("");

  const currentQuestion = questions[currentIndex] ?? null;
  const resolvedRole = useMemo(() => {
    if (!setup) {
      return "";
    }

    return setup.role === "Custom Role" ? setup.customRole.trim() : setup.role;
  }, [setup]);
  const progress = questions.length
    ? Math.min(100, Math.round((records.length / questions.length) * 100))
    : 0;
  const activeTranscript = speech.liveTranscript || manualTranscript;

  const speak = useCallback(
    async (text: string, nextPhase: VoiceInterviewPhase) => {
      setPhase(nextPhase);
      await tts.speak(text);
    },
    [tts]
  );

  const speakCurrentQuestion = useCallback(
    async (question: InterviewQuestion | null = currentQuestion) => {
      if (!question) {
        return;
      }

      await speak(question.question, "asking");
      setPhase("listening");
    },
    [currentQuestion, speak]
  );

  const startInterview = useCallback(
    async (values: VoiceSetupValues) => {
      if (!context) {
        setError("Analyze a resume before starting a voice interview.");
        return;
      }

      if (!speech.isSupported) {
        setError(
          "Speech recognition is not supported in this browser. You can use Text Interview instead."
        );
        return;
      }

      const role = values.role === "Custom Role" ? values.customRole.trim() : values.role;

      if (!role) {
        setError("Enter a custom role before starting.");
        return;
      }

      setSetup(values);
      setPhase("generating");
      setQuestions([]);
      setCurrentIndex(0);
      setRecords([]);
      setLatestEvaluation(null);
      setSummary(null);
      setManualTranscript("");
      setError(null);

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
          throw new Error(payload.error ?? "Unable to generate voice interview.");
        }

        setQuestions(payload.questions);
        await speak(
          `Welcome to your ${role} voice mock interview. I will ask one question at a time. Answer naturally, then stop listening to submit your response.`,
          "welcome"
        );
        await speak(payload.questions[0]?.question ?? "", "asking");
        setPhase("listening");
      } catch (startError) {
        setError(
          startError instanceof Error
            ? startError.message
            : "Unable to start voice interview."
        );
        setPhase("setup");
      }
    },
    [context, speak, speech.isSupported]
  );

  const summarize = useCallback(
    async (nextRecords: InterviewAnswerRecord[]) => {
      if (!context || !setup) {
        const localSummary = createLocalVoiceSummary(nextRecords);
        setSummary(localSummary);
        setPhase("complete");
        await speak(
          `Your interview is complete. Overall score ${localSummary.overallScore}. Recommended topics include ${localSummary.recommendedTopics.join(", ")}.`,
          "complete"
        );
        return;
      }

      setPhase("summarizing");

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
          throw new Error(payload.error ?? "Unable to summarize voice interview.");
        }

        const skippedPenalty = Math.min(
          25,
          nextRecords.filter((record) => record.skipped).length * 8
        );
        const nextSummary: VoiceInterviewSummary = {
          ...payload.summary,
          confidenceScore: Math.max(0, payload.summary.communicationScore - skippedPenalty),
        };
        setSummary(nextSummary);
        setPhase("complete");
        await speak(
          `Your interview is complete. Overall score ${nextSummary.overallScore}. Technical score ${nextSummary.technicalScore}. Communication score ${nextSummary.communicationScore}.`,
          "complete"
        );
      } catch (summaryError) {
        const localSummary = createLocalVoiceSummary(nextRecords);
        setError(
          summaryError instanceof Error
            ? summaryError.message
            : "Unable to summarize voice interview."
        );
        setSummary(localSummary);
        setPhase("complete");
      }
    },
    [context, resolvedRole, setup, speak]
  );

  const moveNext = useCallback(
    async (nextRecords: InterviewAnswerRecord[], nextQuestions = questions) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= nextQuestions.length) {
        await summarize(nextRecords);
        return;
      }

      setCurrentIndex(nextIndex);
      setManualTranscript("");
      await speakCurrentQuestion(nextQuestions[nextIndex]);
    },
    [currentIndex, questions, speakCurrentQuestion, summarize]
  );

  const submitTranscript = useCallback(
    async (transcript?: string) => {
      if (!context || !setup || !currentQuestion) {
        return;
      }

      const answer = (transcript ?? activeTranscript).trim();

      if (!answer) {
        setError("No spoken answer was captured. Try recording again.");
        return;
      }

      setPhase("processing");
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
          throw new Error(payload.error ?? "Unable to evaluate spoken answer.");
        }

        const nextRecords = [
          ...records,
          {
            question: currentQuestion,
            answer,
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
                id: `${currentQuestion.id}-voice-follow-up-${(currentQuestion.followUpDepth ?? 0) + 1}`,
                type: currentQuestion.type,
                question: payload.evaluation.followUpQuestion ?? "",
                source: "AI voice follow-up",
                followUpDepth: (currentQuestion.followUpDepth ?? 0) + 1,
                parentQuestionId:
                  currentQuestion.parentQuestionId ?? currentQuestion.id,
              },
              ...questions.slice(currentIndex + 1),
            ]
          : questions;

        setLatestEvaluation(payload.evaluation);
        setRecords(nextRecords);
        setQuestions(nextQuestions);
        await speak(
          `Feedback. Score ${payload.evaluation.score} out of 10. ${payload.evaluation.improvements[0] ?? "Keep your answer specific and structured."}`,
          "feedback"
        );
        await moveNext(nextRecords, nextQuestions);
      } catch (evaluationError) {
        setError(
          evaluationError instanceof Error
            ? evaluationError.message
            : "Unable to evaluate spoken answer."
        );
        setPhase("listening");
      }
    },
    [
      activeTranscript,
      context,
      currentIndex,
      currentQuestion,
      moveNext,
      questions,
      records,
      resolvedRole,
      setup,
      speak,
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
    tts.stop();
    setPhase("setup");
    setSetup(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRecords([]);
    setLatestEvaluation(null);
    setSummary(null);
    setManualTranscript("");
    setError(null);
  }, [tts]);

  return {
    phase,
    setup,
    questions,
    currentQuestion,
    currentIndex,
    records,
    latestEvaluation,
    summary,
    error: error ?? speech.error ?? tts.error,
    progress,
    transcript: activeTranscript,
    manualTranscript,
    setManualTranscript,
    speech,
    tts,
    isSpeaking: tts.isSpeaking,
    isListening: speech.isListening,
    resolvedRole,
    startInterview,
    speakCurrentQuestion,
    submitTranscript,
    skipQuestion,
    endInterview,
    resetInterview,
  };
}
