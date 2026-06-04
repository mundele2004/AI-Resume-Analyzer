"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  ClipboardCheck,
  Code2,
  Download,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  PanelsTopLeft,
  Phone,
  BriefcaseBusiness,
  SearchCheck,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { generateResumeReportPdf } from "@/lib/pdf-report";

const RESULTS_STORAGE_KEY = "ats-analysis-result";

type AtsAnalysis = {
  atsScore: number;
  breakdown: {
    contact: number;
    skills: number;
    projects: number;
    experience: number;
    education: number;
    keywords: number;
  };
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

type JobMatchAnalysis = {
  matchScore: number;
  matchedSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
};

type InterviewQuestionsAnalysis = {
  technicalQuestions: string[];
  projectQuestions: string[];
  behavioralQuestions: string[];
};

type StoredResults = {
  analysis: AtsAnalysis;
  jobMatch: JobMatchAnalysis | null;
  interviewQuestions: InterviewQuestionsAnalysis | null;
  resumeText: string;
  jobDescription: string;
  message: string | null;
  source: string | null;
};

type InterviewAnswerResponse =
  | { success: true; answer: string }
  | { success: false; error?: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredResults(value: unknown): value is StoredResults {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredResults>;
  const analysis = candidate.analysis;
  const breakdown = analysis?.breakdown;

  if (!analysis || !breakdown) {
    return false;
  }

  const validAnalysis =
    typeof analysis.atsScore === "number" &&
    typeof breakdown.contact === "number" &&
    typeof breakdown.skills === "number" &&
    typeof breakdown.projects === "number" &&
    typeof breakdown.experience === "number" &&
    typeof breakdown.education === "number" &&
    typeof breakdown.keywords === "number" &&
    isStringArray(analysis.skills) &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.weaknesses) &&
    isStringArray(analysis.suggestions);

  if (!validAnalysis) {
    return false;
  }

  if (typeof candidate.resumeText !== "string") {
    return false;
  }

  if (typeof candidate.jobDescription !== "string") {
    return false;
  }

  if (candidate.jobMatch == null) {
    return isValidInterviewQuestions(candidate.interviewQuestions);
  }

  const jobMatch = candidate.jobMatch as Partial<JobMatchAnalysis>;

  const validJobMatch =
    typeof jobMatch.matchScore === "number" &&
    isStringArray(jobMatch.matchedSkills) &&
    isStringArray(jobMatch.missingKeywords) &&
    isStringArray(jobMatch.recommendations);

  return (
    validJobMatch && isValidInterviewQuestions(candidate.interviewQuestions)
  );
}

function isValidInterviewQuestions(value: unknown) {
  if (value == null) {
    return true;
  }

  const interviewQuestions = value as Partial<InterviewQuestionsAnalysis>;

  return (
    isStringArray(interviewQuestions.technicalQuestions) &&
    isStringArray(interviewQuestions.projectQuestions) &&
    isStringArray(interviewQuestions.behavioralQuestions)
  );
}

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Strong ATS fit";
  }

  if (score >= 80) {
    return "Competitive profile";
  }

  if (score >= 70) {
    return "Good foundation";
  }

  return "Needs attention";
}

function getAtsGrade(score: number) {
  if (score >= 95) {
    return "A+";
  }

  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B+";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "text-emerald-500",
      chart: "#10b981",
      soft: "bg-emerald-500/10 border-emerald-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
      badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (score >= 80) {
    return {
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500",
      chart: "#3b82f6",
      soft: "bg-blue-500/10 border-blue-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-blue-500",
      badge: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    };
  }

  if (score >= 70) {
    return {
      text: "text-amber-700 dark:text-amber-300",
      icon: "text-amber-500",
      chart: "#f59e0b",
      soft: "bg-amber-500/10 border-amber-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      badge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    text: "text-rose-700 dark:text-rose-300",
    icon: "text-rose-500",
    chart: "#f43f5e",
    soft: "bg-rose-500/10 border-rose-500/25",
    progress: "[&_[data-slot=progress-indicator]]:bg-rose-500",
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
}

function getMatchLabel(score: number) {
  if (score >= 85) {
    return "Strong job match";
  }

  if (score >= 65) {
    return "Partial job match";
  }

  return "Keyword gap detected";
}

function getOverallAssessment(analysis: AtsAnalysis) {
  if (analysis.atsScore >= 90) {
    return "Strong resume foundation with clear ATS signals. Focus on small keyword and role-specific refinements before applying.";
  }

  if (analysis.atsScore >= 70) {
    return "Good resume foundation with a few important optimization gaps. Prioritize the highest-impact suggestions before sending applications.";
  }

  return "This resume needs targeted ATS improvements. Start with missing sections, measurable impact, and role-aligned keywords.";
}

function getResumeVerdict(analysis: AtsAnalysis) {
  const primaryImprovement =
    analysis.weaknesses[0]?.replace(/\.$/, "") ?? "role-specific keywords";

  if (analysis.atsScore >= 90) {
    return {
      title: "Competitive Profile",
      summary:
        "Strong technical foundation with relevant resume signals and a polished ATS structure.",
      improvement: primaryImprovement,
      recommendedFor:
        "Internships, entry-level software roles, and targeted technical applications.",
    };
  }

  if (analysis.atsScore >= 70) {
    return {
      title: "Promising Candidate",
      summary:
        "Good resume foundation with clear strengths and a few optimization opportunities.",
      improvement: primaryImprovement,
      recommendedFor:
        "Entry-level roles after tightening keywords, impact, and missing sections.",
    };
  }

  return {
    title: "Needs Focused Optimization",
    summary:
      "The resume has useful signals, but important ATS-friendly details need to be clearer.",
    improvement: primaryImprovement,
    recommendedFor:
      "Early applications after improving structure, measurable impact, and core role keywords.",
  };
}

function subscribeToStoredResults(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredResultsSnapshot() {
  return sessionStorage.getItem(RESULTS_STORAGE_KEY);
}

function getServerStoredResultsSnapshot() {
  return null;
}

function parseStoredResults(stored: string | null) {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    return isStoredResults(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function ResultList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <EmptyInlineState
        title="Nothing to show yet"
        description="This section will fill in once the analysis finds relevant resume signals."
      />
    );
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return (
      <EmptyInlineState
        title="No skills detected"
        description="Add a clear skills section with role-relevant technologies to improve keyword visibility."
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function EmptyInlineState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-background/70 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ResumeVerdictCard({ analysis }: { analysis: AtsAnalysis }) {
  const verdict = getResumeVerdict(analysis);

  return (
    <Card className="rounded-lg border bg-card shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-sky-500" aria-hidden="true" />
          Resume Verdict
        </CardTitle>
        <CardDescription>{verdict.title}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-6">
        <p className="font-medium text-foreground">{verdict.summary}</p>
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Primary improvement area
          </p>
          <p className="mt-1 text-muted-foreground">{verdict.improvement}</p>
        </div>
        <div className="rounded-lg border bg-background px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Recommended for
          </p>
          <p className="mt-1 text-muted-foreground">{verdict.recommendedFor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBreakdown({ analysis }: { analysis: AtsAnalysis }) {
  const breakdownItems = [
    [
      "Contact",
      analysis.breakdown.contact,
      10,
      Phone,
      "Email, phone, and LinkedIn/GitHub signals.",
    ],
    [
      "Skills",
      analysis.breakdown.skills,
      20,
      Wrench,
      "Skills section presence and at least five technical skills.",
    ],
    [
      "Projects",
      analysis.breakdown.projects,
      25,
      PanelsTopLeft,
      "Projects section, multiple projects, and measurable impact.",
    ],
    [
      "Experience",
      analysis.breakdown.experience,
      25,
      BriefcaseBusiness,
      "Experience section plus internship or job experience signals.",
    ],
    [
      "Education",
      analysis.breakdown.education,
      10,
      GraduationCap,
      "Education section presence.",
    ],
    [
      "Keywords",
      analysis.breakdown.keywords,
      15,
      SearchCheck,
      "Common ATS keywords detected in the resume.",
    ],
  ] as const;

  return (
    <Card className="rounded-lg border bg-card shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-5 text-sky-500" aria-hidden="true" />
          Score Breakdown
        </CardTitle>
        <CardDescription>Weighted ATS scoring signals.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {breakdownItems.map(([label, value, max, Icon, tooltip]) => (
          <div key={label} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="size-4 text-sky-500" aria-hidden="true" />
                {label}
                <span title={tooltip}>
                  <HelpCircle
                    className="size-3.5 text-muted-foreground"
                    aria-label={tooltip}
                  />
                </span>
              </span>
              <span className="text-muted-foreground">
                {value} / {max}
              </span>
            </div>
            <Progress value={(value / max) * 100} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  onClick,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Trophy;
  iconClassName: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="rounded-lg border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500/35 hover:shadow-lg"
      size="sm"
    >
      <CardContent className="flex items-center justify-between gap-4 py-1">
        <button
          className="flex w-full items-center justify-between gap-4 text-left"
          onClick={onClick}
          type="button"
        >
          <span>
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <span className="mt-1 block text-3xl font-semibold tracking-normal">
              {value}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {description}
            </span>
          </span>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
            <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
          </span>
        </button>
      </CardContent>
    </Card>
  );
}

function EmptyTabState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon: typeof SearchCheck;
  action: string;
}) {
  return (
    <Card className="rounded-lg border border-dashed bg-card/80 shadow-sm">
      <CardHeader className="items-center text-center">
        <span className="grid size-12 place-items-center rounded-lg bg-muted">
          <Icon className="size-6 text-sky-500" aria-hidden="true" />
        </span>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="max-w-xl leading-6">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 text-center text-sm font-medium text-muted-foreground">
        {action}
      </CardContent>
    </Card>
  );
}

function JobMatchLockedState() {
  const unlockItems = [
    "Match Score",
    "Missing Keywords",
    "Matched Skills",
    "Personalized Recommendations",
    "Tailored Interview Questions",
  ];

  return (
    <Card className="rounded-lg border border-dashed bg-card/80 shadow-sm">
      <CardHeader className="items-center text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-sky-500/10 text-2xl">
          🎯
        </span>
        <CardTitle className="text-xl">Job Match Analysis Locked</CardTitle>
        <CardDescription className="max-w-xl leading-6">
          Paste a job description during analysis to unlock role-specific match
          insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="mx-auto grid w-full max-w-md gap-2 pb-6">
        {unlockItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <BadgeCheck className="size-4 text-emerald-500" aria-hidden="true" />
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TopActionItems({ suggestions }: { suggestions: string[] }) {
  const actions = suggestions.slice(0, 3);

  return (
    <Card className="rounded-lg border bg-card shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" aria-hidden="true" />
          Top 3 Action Items
        </CardTitle>
        <CardDescription>Fastest improvements to prioritize.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResultList items={actions} />
      </CardContent>
    </Card>
  );
}

function getQuestionDifficulty(question: string, index: number) {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("architecture") ||
    lowerQuestion.includes("tradeoff") ||
    lowerQuestion.includes("scale") ||
    lowerQuestion.includes("debug") ||
    index >= 4
  ) {
    return "Hard";
  }

  if (
    lowerQuestion.includes("why") ||
    lowerQuestion.includes("how") ||
    lowerQuestion.includes("challenge") ||
    index >= 2
  ) {
    return "Medium";
  }

  return "Easy";
}

function getDifficultyClassName(difficulty: string) {
  if (difficulty === "Easy") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (difficulty === "Medium") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

function CollapsibleInsight({
  title,
  description,
  icon: Icon,
  iconClassName,
  items,
}: {
  title: string;
  description: string;
  icon: typeof BadgeCheck;
  iconClassName: string;
  items: string[];
}) {
  return (
    <Card className="rounded-lg border bg-card shadow-sm" size="sm">
      <Accordion type="single" collapsible>
        <AccordionItem value={title} className="border-0 bg-transparent">
          <AccordionTrigger className="px-3 py-1 hover:bg-transparent">
            <span className="text-left">
              <span className="flex items-center gap-2 font-medium">
                <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
                {title} ({items.length})
              </span>
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                {description}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-3">
            <ResultList items={items} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function InterviewQuestionCategory({
  title,
  description,
  icon: Icon,
  iconClassName,
  questions,
  resumeText,
  jobDescription,
}: {
  title: string;
  description: string;
  icon: typeof Code2;
  iconClassName: string;
  questions: string[];
  resumeText: string;
  jobDescription: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});

  async function handleGenerateAnswer(question: string) {
    if (answers[question] || loadingQuestion) {
      return;
    }

    setLoadingQuestion(question);
    setAnswerErrors((current) => {
      const next = { ...current };
      delete next[question];
      return next;
    });

    try {
      const response = await fetch("/api/interview-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          resumeText,
          jobDescription,
        }),
      });
      const result = (await response.json()) as InterviewAnswerResponse;

      if (!result.success) {
        setAnswerErrors((current) => ({
          ...current,
          [question]: result.error ?? "Unable to generate an answer.",
        }));
        return;
      }

      setAnswers((current) => ({
        ...current,
        [question]: result.answer,
      }));
    } catch (error) {
      console.error("Interview answer generation failed:", error);
      setAnswerErrors((current) => ({
        ...current,
        [question]: "Unable to generate an answer. Please try again.",
      }));
    } finally {
      setLoadingQuestion(null);
    }
  }

  return (
    <AccordionItem value={title}>
      <AccordionTrigger>
        <span className="text-left">
          <span className="flex items-center gap-2 font-medium">
            <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
            {title} ({questions.length})
          </span>
          <span className="mt-1 block text-sm font-normal text-muted-foreground">
            {description}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        {questions.length > 0 ? (
          <Accordion type="multiple" className="gap-2">
            {questions.map((question, index) => (
              <AccordionItem key={question} value={`${title}-${index}`}>
                <AccordionTrigger>
                  <span className="flex flex-col gap-1 text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{question}</span>
                      <span
                        className={`inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium ${getDifficultyClassName(
                          getQuestionDifficulty(question, index)
                        )}`}
                      >
                        {getQuestionDifficulty(question, index)}
                      </span>
                    </span>
                    {answers[question] && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Answer generated
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingQuestion === question}
                      onClick={() => handleGenerateAnswer(question)}
                    >
                      {answers[question]
                        ? "Answer Generated"
                        : loadingQuestion === question
                          ? "Generating..."
                          : "Generate Answer"}
                    </Button>
                    {answerErrors[question] && (
                      <span className="text-xs font-medium text-destructive">
                        {answerErrors[question]}
                      </span>
                    )}
                  </div>

                  {answers[question] && (
                    <div className="mt-3 rounded-lg border bg-card px-3 py-3">
                      <p className="text-sm font-medium text-foreground">
                        AI Generated Answer
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {answers[question]}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <EmptyInlineState
            title="No questions generated"
            description="Try adding more project, technology, or experience details to create richer interview prep."
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ResultsPage() {
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("ats");
  const storedResults = useSyncExternalStore(
    subscribeToStoredResults,
    getStoredResultsSnapshot,
    getServerStoredResultsSnapshot
  );
  const results = useMemo(() => parseStoredResults(storedResults), [storedResults]);
  const score = results?.analysis.atsScore ?? 0;
  const jobMatchScore = results?.jobMatch?.matchScore;
  const interviewQuestionCount = results?.interviewQuestions
    ? results.interviewQuestions.technicalQuestions.length +
      results.interviewQuestions.projectQuestions.length +
      results.interviewQuestions.behavioralQuestions.length
    : 0;
  const scoreLabel = useMemo(() => getScoreLabel(score), [score]);
  const scoreTone = useMemo(() => getScoreTone(score), [score]);
  const atsGrade = useMemo(() => getAtsGrade(score), [score]);
  const overallAssessment = useMemo(
    () => (results ? getOverallAssessment(results.analysis) : ""),
    [results]
  );

  async function handleDownloadReport() {
    if (!results || isDownloadingReport) {
      return;
    }

    setIsDownloadingReport(true);

    try {
      await Promise.resolve(generateResumeReportPdf(results));
    } finally {
      setIsDownloadingReport(false);
    }
  }

  if (!results) {
    return (
      <main className="min-h-screen bg-muted/30 px-6 py-10 text-foreground sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <Card className="w-full rounded-lg border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">No results found</CardTitle>
              <CardDescription>
                Upload a resume to generate an ATS dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to upload
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-5 py-6 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              ATS Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Resume Analysis Results
            </h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              className="h-10 w-full px-4 shadow-lg shadow-blue-950/10 sm:w-auto"
              disabled={isDownloadingReport}
              onClick={handleDownloadReport}
            >
              <Download className="size-4" aria-hidden="true" />
              {isDownloadingReport ? "Generating PDF..." : "Download Report"}
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Analyze another resume
              </Link>
            </Button>
          </div>
        </header>

        {results?.message && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
            {results.message}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <OverviewCard
            title="ATS Score"
            value={`${score}/100`}
            description={scoreLabel}
            icon={Trophy}
            iconClassName={scoreTone.icon}
            onClick={() => setActiveTab("ats")}
          />
          <OverviewCard
            title="Job Match Score"
            value={jobMatchScore == null ? "N/A" : `${jobMatchScore}/100`}
            description={
              jobMatchScore == null
                ? "Add a job description"
                : getMatchLabel(jobMatchScore)
            }
            icon={SearchCheck}
            iconClassName="text-sky-500"
            onClick={() => setActiveTab("job-match")}
          />
          <OverviewCard
            title="Interview Questions"
            value={`${interviewQuestionCount}`}
            description={
              interviewQuestionCount > 0
                ? "Personalized prompts"
                : "Run analysis to generate"
            }
            icon={MessageSquareText}
            iconClassName="text-emerald-500"
            onClick={() => setActiveTab("interview")}
          />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-3">
          <div className="overflow-x-auto pb-1">
            <TabsList>
              <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
              <TabsTrigger value="job-match">Job Match</TabsTrigger>
              <TabsTrigger value="interview">Interview Prep</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ats" className="grid gap-4">
            <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
              <div className="grid gap-4">
                <Card className={`rounded-lg border shadow-sm ${scoreTone.soft}`}>
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy
                        className={`size-5 ${scoreTone.icon}`}
                        aria-hidden="true"
                      />
                      ATS Score
                    </CardTitle>
                    <CardDescription className={scoreTone.text}>
                      {scoreLabel}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-end gap-2">
                        <span
                          className={`text-5xl font-semibold tracking-normal ${scoreTone.text}`}
                        >
                          {score}
                        </span>
                        <span className="pb-2 text-lg font-medium text-muted-foreground">
                          / 100
                        </span>
                        <span
                          className={`mb-2 rounded-lg border px-2 py-1 text-sm font-semibold ${scoreTone.badge}`}
                        >
                          {atsGrade}
                        </span>
                      </div>
                      <div
                        className="grid size-20 shrink-0 place-items-center rounded-full"
                        style={{
                          background: `conic-gradient(${scoreTone.chart} ${score}%, var(--muted) 0)`,
                        }}
                        aria-label={`ATS score ${score} out of 100`}
                      >
                        <div className="size-12 rounded-full bg-card ring-1 ring-border" />
                      </div>
                    </div>
                    <Progress
                      value={score}
                      className={`mt-4 h-2 bg-background/70 ${scoreTone.progress}`}
                    />
                  </CardContent>
                </Card>

                <TopActionItems suggestions={results.analysis.suggestions} />

                <ScoreBreakdown analysis={results.analysis} />
              </div>

              <div className="grid gap-4">
                <ResumeVerdictCard analysis={results.analysis} />

                <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles
                          className="size-5 text-sky-500"
                          aria-hidden="true"
                        />
                        Overall Assessment
                      </CardTitle>
                      <CardDescription>
                        Concise readout from the resume signals.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {overallAssessment}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <ListChecks
                          className="size-5 text-sky-500"
                          aria-hidden="true"
                        />
                        Skills
                      </CardTitle>
                      <CardDescription>
                        {results.analysis.skills.length} detected keywords
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillChips skills={results.analysis.skills} />
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-3 lg:grid-cols-2">
                  <CollapsibleInsight
                    title="Strengths"
                    description="Positive resume signals"
                    icon={BadgeCheck}
                    iconClassName="text-emerald-500"
                    items={results.analysis.strengths}
                  />
                  <CollapsibleInsight
                    title="Weaknesses"
                    description="Gaps to review"
                    icon={CircleAlert}
                    iconClassName="text-rose-500"
                    items={results.analysis.weaknesses}
                  />
                </section>

                <CollapsibleInsight
                  title="Suggestions"
                  description="Highest-priority next edits"
                  icon={Lightbulb}
                  iconClassName="text-amber-500"
                  items={results.analysis.suggestions}
                />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="job-match" className="grid gap-4">
            {results.jobMatch ? (
              <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
                <Card className="rounded-lg border bg-card shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2">
                      <SearchCheck
                        className="size-5 text-sky-500"
                        aria-hidden="true"
                      />
                      Match Score
                    </CardTitle>
                    <CardDescription>
                      {getMatchLabel(results.jobMatch.matchScore)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-semibold tracking-normal">
                        {results.jobMatch.matchScore}
                      </span>
                      <span className="pb-1.5 text-base font-medium text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <Progress
                      value={results.jobMatch.matchScore}
                      className="mt-4 h-2 [&_[data-slot=progress-indicator]]:bg-sky-500"
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck
                          className="size-5 text-emerald-500"
                          aria-hidden="true"
                        />
                        Matched Skills
                      </CardTitle>
                      <CardDescription>
                        Skills aligned with the job.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillChips skills={results.jobMatch.matchedSkills} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <CircleAlert
                          className="size-5 text-rose-500"
                          aria-hidden="true"
                        />
                        Missing Keywords
                      </CardTitle>
                      <CardDescription>
                        Terms to consider adding truthfully.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillChips skills={results.jobMatch.missingKeywords} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb
                          className="size-5 text-amber-500"
                          aria-hidden="true"
                        />
                        Recommendations
                      </CardTitle>
                      <CardDescription>
                        Targeted job-match improvements.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResultList items={results.jobMatch.recommendations} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <JobMatchLockedState />
            )}
          </TabsContent>

          <TabsContent value="interview" className="grid gap-4">
            {results.interviewQuestions ? (
              <Card className="rounded-lg border bg-card shadow-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText
                      className="size-5 text-emerald-500"
                      aria-hidden="true"
                    />
                    Interview Questions
                  </CardTitle>
                  <CardDescription>
                    Expand a category, then open a question to generate or view
                    its answer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple">
                    <InterviewQuestionCategory
                      title="Technical Questions"
                      description="Technology-focused prompts"
                      icon={Code2}
                      iconClassName="text-sky-500"
                      questions={results.interviewQuestions.technicalQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                    <InterviewQuestionCategory
                      title="Project Questions"
                      description="Resume-project prompts"
                      icon={PanelsTopLeft}
                      iconClassName="text-violet-500"
                      questions={results.interviewQuestions.projectQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                    <InterviewQuestionCategory
                      title="Behavioral Questions"
                      description="Experience-based prompts"
                      icon={MessageSquareText}
                      iconClassName="text-emerald-500"
                      questions={results.interviewQuestions.behavioralQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <EmptyTabState
                title="No interview prep yet"
                description="Interview prep appears after the analysis returns personalized question sets from the resume and optional job description."
                icon={MessageSquareText}
                action="Add clear projects, technologies, and experience details to get more targeted questions and stronger answer guidance."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
