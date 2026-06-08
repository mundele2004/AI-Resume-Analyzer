export const JOB_ROLES = [
  "Software Development Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Custom Role",
] as const;

export const INTERVIEW_DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export const INTERVIEW_DURATIONS = [5, 10, 15] as const;
export const INTERVIEW_MODES = ["Text Interview", "Voice Interview"] as const;

export type JobRole = (typeof JOB_ROLES)[number];
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number];
export type InterviewDuration = (typeof INTERVIEW_DURATIONS)[number];
export type InterviewMode = (typeof INTERVIEW_MODES)[number];
export type InterviewQuestionType = "technical" | "project" | "behavioral";

export type AtsAnalysisContext = {
  atsScore: number;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type MockInterviewContext = {
  resumeText: string;
  atsAnalysis: AtsAnalysisContext;
  jobDescription?: string;
};

export type InterviewSetupValues = {
  role: JobRole;
  customRole: string;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
  mode: InterviewMode;
};

export type InterviewQuestion = {
  id: string;
  type: InterviewQuestionType;
  question: string;
  source?: string;
  followUpDepth?: number;
  parentQuestionId?: string;
};

export type InterviewEvaluation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  improvements: string[];
  followUpQuestion?: string | null;
};

export type InterviewAnswerRecord = {
  question: InterviewQuestion;
  answer: string;
  evaluation: InterviewEvaluation | null;
  skipped: boolean;
};

export type InterviewSummary = {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  behavioralScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  nextSteps: string[];
};
