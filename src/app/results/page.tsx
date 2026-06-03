"use client";

import { useMemo, useSyncExternalStore } from "react";
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

const RESULTS_STORAGE_KEY = "ats-analysis-result";

type AtsAnalysis = {
  atsScore: number;
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
  message: string | null;
  source: string | null;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredResults(value: unknown): value is StoredResults {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredResults>;
  const analysis = candidate.analysis;

  if (!analysis) {
    return false;
  }

  const validAnalysis =
    typeof analysis.atsScore === "number" &&
    isStringArray(analysis.skills) &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.weaknesses) &&
    isStringArray(analysis.suggestions);

  if (!validAnalysis) {
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
}: {
  title: string;
  description: string;
  icon: typeof Code2;
  iconClassName: string;
  questions: string[];
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
          <ResultList items={questions} />
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
                <ResultList items={results.analysis.suggestions.slice(0, 4)} />
              </CardContent>
            </Card>
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
                    AI Resume Summary
                  </CardTitle>
                  <CardDescription>
                    Synthesized from the ATS analysis.
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

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold">
                  {results.analysis.skills.length}
                </p>
                <p className="text-sm text-muted-foreground">Skills found</p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold">
                  {results.analysis.strengths.length}
                </p>
                <p className="text-sm text-muted-foreground">Strengths</p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-2xl font-semibold">
                  {results.analysis.weaknesses.length}
                </p>
                <p className="text-sm text-muted-foreground">Weaknesses</p>
              </div>
            </section>
          </div>
        </section>

        {results.jobMatch && (
          <section className="grid gap-4 rounded-lg border bg-background/60 p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                  Job Match
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                  Job Description Matching
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Resume compared against the pasted job description.
              </p>
            </div>

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
          </section>
        )}

        {results.interviewQuestions && (
          <section className="grid gap-4 rounded-lg border bg-background/60 p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                  Interview Questions
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                  Personalized Interview Prep
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Questions generated from the resume
                {results.jobMatch ? " and target job description." : "."}
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <InterviewQuestionCard
                title="Technical Questions"
                description={`${results.interviewQuestions.technicalQuestions.length} technology-focused prompts`}
                icon={Code2}
                iconClassName="text-sky-500"
                questions={results.interviewQuestions.technicalQuestions}
              />
              <InterviewQuestionCard
                title="Project Questions"
                description={`${results.interviewQuestions.projectQuestions.length} resume-project prompts`}
                icon={PanelsTopLeft}
                iconClassName="text-violet-500"
                questions={results.interviewQuestions.projectQuestions}
              />
              <InterviewQuestionCard
                title="Behavioral Questions"
                description={`${results.interviewQuestions.behavioralQuestions.length} experience-based prompts`}
                icon={MessageSquareText}
                iconClassName="text-emerald-500"
                questions={results.interviewQuestions.behavioralQuestions}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
