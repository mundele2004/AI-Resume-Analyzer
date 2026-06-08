import type {
  InterviewAnswerRecord,
  InterviewDifficulty,
  InterviewDuration,
  InterviewEvaluation,
  InterviewQuestion,
  InterviewSetupValues,
  InterviewSummary,
  JobRole,
} from "@/types/interview";

export type VoiceInterviewPhase =
  | "setup"
  | "generating"
  | "welcome"
  | "asking"
  | "listening"
  | "processing"
  | "feedback"
  | "summarizing"
  | "complete";

export type VoiceRecordingState =
  | "idle"
  | "requesting"
  | "listening"
  | "recording"
  | "processing"
  | "error";

export type VoiceSetupValues = InterviewSetupValues & {
  role: JobRole;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
  mode: "Voice Interview";
};

export type VoiceInterviewState = {
  phase: VoiceInterviewPhase;
  questions: InterviewQuestion[];
  currentQuestion: InterviewQuestion | null;
  currentIndex: number;
  records: InterviewAnswerRecord[];
  latestEvaluation: InterviewEvaluation | null;
  summary: VoiceInterviewSummary | null;
  transcript: string;
  finalTranscript: string;
  progress: number;
  error: string | null;
};

export type VoiceInterviewSummary = InterviewSummary & {
  confidenceScore: number;
};
