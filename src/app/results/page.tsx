"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Code2,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  PanelsTopLeft,
  SearchCheck,
  Sparkles,
  Trophy,
} from "lucide-react";

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

  if (score >= 70) {
    return "Good foundation";
  }

  return "Needs attention";
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "text-emerald-500",
      chart: "#10b981",
      soft: "bg-emerald-500/10 border-emerald-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
    };
  }

  if (score >= 70) {
    return {
      text: "text-amber-700 dark:text-amber-300",
      icon: "text-amber-500",
      chart: "#f59e0b",
      soft: "bg-amber-500/10 border-amber-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
    };
  }

  return {
    text: "text-rose-700 dark:text-rose-300",
    icon: "text-rose-500",
    chart: "#f43f5e",
    soft: "bg-rose-500/10 border-rose-500/25",
    progress: "[&_[data-slot=progress-indicator]]:bg-rose-500",
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

function getResumeSummary(analysis: AtsAnalysis) {
  const strongestSignal = analysis.strengths[0] ?? "clear resume structure";
  const primaryGap =
    analysis.weaknesses[0] ?? "fine-tuning keywords for each target role";
  const nextMove =
    analysis.suggestions[0] ??
    "Keep tailoring your resume keywords to the target job description.";

  return `${getScoreLabel(
    analysis.atsScore
  )}. The resume shows ${strongestSignal.toLowerCase()} The main improvement area is ${primaryGap.toLowerCase()} Recommended next step: ${nextMove}`;
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
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.length > 0 ? (
        items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))
      ) : (
        <li className="text-muted-foreground">No items returned.</li>
      )}
    </ul>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">No skills returned.</p>;
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

function ScoreBreakdown({ analysis }: { analysis: AtsAnalysis }) {
  const breakdownItems = [
    ["Contact", analysis.breakdown.contact, 10],
    ["Skills", analysis.breakdown.skills, 20],
    ["Projects", analysis.breakdown.projects, 25],
    ["Experience", analysis.breakdown.experience, 25],
    ["Education", analysis.breakdown.education, 10],
    ["Keywords", analysis.breakdown.keywords, 15],
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
        {breakdownItems.map(([label, value, max]) => (
          <div key={label} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{label}</span>
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

function EmptyTabState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-lg border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
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
      <details className="group">
        <summary className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 px-3 py-1 marker:content-['']">
          <span>
            <span className="flex items-center gap-2 font-medium">
              <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
              {title}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {description}
            </span>
          </span>
          <ChevronDown
            className="mt-1 size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t px-3 pb-3 pt-3">
          <ResultList items={items} />
        </div>
      </details>
    </Card>
  );
}

function InterviewQuestionCard({
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
    <Card className="rounded-lg border bg-card shadow-sm" size="sm">
      <details className="group">
        <summary className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 px-3 py-1 marker:content-['']">
          <span>
            <span className="flex items-center gap-2 font-medium">
              <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
              {title}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {description}
            </span>
          </span>
          <ChevronDown
            className="mt-1 size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t px-3 pb-3 pt-3">
          <ul className="space-y-3">
            {questions.length > 0 ? (
              questions.map((question) => (
                <li
                  key={question}
                  className="rounded-lg border bg-background p-3"
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    {question}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    <details className="mt-3 rounded-lg border bg-card">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-medium marker:content-['']">
                        View Answer
                      </summary>
                      <div className="border-t px-3 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {answers[question]}
                        </p>
                      </div>
                    </details>
                  )}
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                No questions returned.
              </li>
            )}
          </ul>
        </div>
      </details>
    </Card>
  );
}

export default function ResultsPage() {
  const storedResults = useSyncExternalStore(
    subscribeToStoredResults,
    getStoredResultsSnapshot,
    getServerStoredResultsSnapshot
  );
  const results = useMemo(() => parseStoredResults(storedResults), [storedResults]);
  const score = results?.analysis.atsScore ?? 0;
  const scoreLabel = useMemo(() => getScoreLabel(score), [score]);
  const scoreTone = useMemo(() => getScoreTone(score), [score]);
  const resumeSummary = useMemo(
    () => (results ? getResumeSummary(results.analysis) : ""),
    [results]
  );

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
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Analyze another resume
            </Link>
          </Button>
        </header>

        {results?.message && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
            {results.message}
          </div>
        )}

        <Tabs defaultValue="ats" className="gap-3">
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
                          className={`text-6xl font-semibold tracking-normal ${scoreTone.text}`}
                        >
                          {score}
                        </span>
                        <span className="pb-2 text-lg font-medium text-muted-foreground">
                          / 100
                        </span>
                      </div>
                      <div
                        className="grid size-24 shrink-0 place-items-center rounded-full"
                        style={{
                          background: `conic-gradient(${scoreTone.chart} ${score}%, var(--muted) 0)`,
                        }}
                        aria-label={`ATS score ${score} out of 100`}
                      >
                        <div className="size-16 rounded-full bg-card ring-1 ring-border" />
                      </div>
                    </div>
                    <Progress
                      value={score}
                      className={`mt-4 h-2 bg-background/70 ${scoreTone.progress}`}
                    />
                  </CardContent>
                </Card>

                <ScoreBreakdown analysis={results.analysis} />
              </div>

              <div className="grid gap-4">
                <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <Card className="rounded-lg border bg-card shadow-sm">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles
                          className="size-5 text-sky-500"
                          aria-hidden="true"
                        />
                        ATS Analysis
                      </CardTitle>
                      <CardDescription>
                        Synthesized from the resume signals.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {resumeSummary}
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
                    description={`${results.analysis.strengths.length} positive signals`}
                    icon={BadgeCheck}
                    iconClassName="text-emerald-500"
                    items={results.analysis.strengths}
                  />
                  <CollapsibleInsight
                    title="Weaknesses"
                    description={`${results.analysis.weaknesses.length} gaps to review`}
                    icon={CircleAlert}
                    iconClassName="text-rose-500"
                    items={results.analysis.weaknesses}
                  />
                </section>

                <Card className="rounded-lg border bg-card shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb
                        className="size-5 text-amber-500"
                        aria-hidden="true"
                      />
                      Suggestions
                    </CardTitle>
                    <CardDescription>Highest-priority next edits.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResultList items={results.analysis.suggestions} />
                  </CardContent>
                </Card>
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
              <EmptyTabState
                title="No job match yet"
                description="Paste a job description during upload to generate match score, matched skills, missing keywords, and recommendations."
              />
            )}
          </TabsContent>

          <TabsContent value="interview" className="grid gap-4">
            {results.interviewQuestions ? (
              <div className="grid gap-3 lg:grid-cols-3">
                <InterviewQuestionCard
                  title="Technical Questions"
                  description={`${results.interviewQuestions.technicalQuestions.length} technology-focused prompts`}
                  icon={Code2}
                  iconClassName="text-sky-500"
                  questions={results.interviewQuestions.technicalQuestions}
                  resumeText={results.resumeText}
                  jobDescription={results.jobDescription}
                />
                <InterviewQuestionCard
                  title="Project Questions"
                  description={`${results.interviewQuestions.projectQuestions.length} resume-project prompts`}
                  icon={PanelsTopLeft}
                  iconClassName="text-violet-500"
                  questions={results.interviewQuestions.projectQuestions}
                  resumeText={results.resumeText}
                  jobDescription={results.jobDescription}
                />
                <InterviewQuestionCard
                  title="Behavioral Questions"
                  description={`${results.interviewQuestions.behavioralQuestions.length} experience-based prompts`}
                  icon={MessageSquareText}
                  iconClassName="text-emerald-500"
                  questions={results.interviewQuestions.behavioralQuestions}
                  resumeText={results.resumeText}
                  jobDescription={results.jobDescription}
                />
              </div>
            ) : (
              <EmptyTabState
                title="No interview prep yet"
                description="Run a resume analysis to generate technical, project, and behavioral questions with AI-generated answers."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
