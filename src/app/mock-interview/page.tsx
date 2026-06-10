"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mic, Sparkles } from "lucide-react";

import { InterviewSession } from "@/components/mock-interview/InterviewSession";
import { InterviewSetup } from "@/components/mock-interview/InterviewSetup";
import { InterviewSummary } from "@/components/mock-interview/InterviewSummary";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInterview } from "@/hooks/useInterview";
import type {
  AtsAnalysisContext,
  InterviewQuestion,
  MockInterviewContext,
} from "@/types/interview";

const RESULTS_STORAGE_KEY = "ats-analysis-result";

type StoredResults = {
  analysis: AtsAnalysisContext;
  resumeText: string;
  jobDescription: string;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredResults(value: unknown): value is StoredResults {
  const candidate = value as Partial<StoredResults>;
  const analysis = candidate?.analysis;

  return (
    !!candidate &&
    typeof candidate.resumeText === "string" &&
    !!analysis &&
    typeof analysis.atsScore === "number" &&
    isStringArray(analysis.skills) &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.weaknesses) &&
    isStringArray(analysis.suggestions)
  );
}

function parseStoredContext(stored: string | null): MockInterviewContext | null {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    if (!isStoredResults(parsed)) {
      return null;
    }

    return {
      resumeText: parsed.resumeText,
      jobDescription: parsed.jobDescription,
      atsAnalysis: {
        atsScore: parsed.analysis.atsScore,
        skills: parsed.analysis.skills,
        strengths: parsed.analysis.strengths,
        weaknesses: parsed.analysis.weaknesses,
        suggestions: parsed.analysis.suggestions,
      },
    };
  } catch {
    return null;
  }
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

function MissingContextState() {
  return (
    <Card className="rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-400/25 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>No analyzed resume found</CardTitle>
        <CardDescription>
          Start from the resume analyzer so the mock interview can use your resume,
          ATS score, detected skills, and job context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Analyze Resume
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MockInterviewPage() {
  const router = useRouter();
  const storedResults = useSyncExternalStore(
    subscribeToStoredResults,
    getStoredResultsSnapshot,
    getServerStoredResultsSnapshot
  );
  const context = useMemo(() => parseStoredContext(storedResults), [storedResults]);
  const interview = useInterview(context);
  const latestQuestion = interview.currentQuestion as InterviewQuestion | null;
  const phaseLabel = useMemo(() => {
    if (interview.phase === "generating") {
      return "Generating questions";
    }

    if (interview.phase === "summarizing") {
      return "Building summary";
    }

    if (interview.phase === "complete") {
      return "Complete";
    }

    return "Ready";
  }, [interview.phase]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] dark:text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {phaseLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Mic className="size-3.5" aria-hidden="true" />
                Voice architecture ready
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              AI Mock Interview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Practice one question at a time with AI scoring, follow-ups, and a
              final coaching summary.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/results">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to Results
              </Link>
            </Button>
          </div>
        </header>

        {interview.error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
            {interview.error}
          </div>
        )}

        {!context ? (
          <MissingContextState />
        ) : interview.phase === "generating" ? (
          <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
            <CardContent className="flex items-center gap-3 py-8">
              <Loader2 className="size-5 animate-spin text-blue-500" aria-hidden="true" />
              <span className="text-sm font-medium">
                Generating personalized interview questions...
              </span>
            </CardContent>
          </Card>
        ) : interview.phase === "setup" ? (
          <InterviewSetup
            detectedSkills={context.atsAnalysis.skills}
            onStart={(values) => {
              if (values.mode === "Voice Interview") {
                sessionStorage.setItem(
                  "mock-interview-setup",
                  JSON.stringify(values)
                );
                router.push("/voice-interview");
                return;
              }

              interview.startInterview(values);
            }}
          />
        ) : interview.phase === "complete" && interview.summary ? (
          <InterviewSummary
            summary={interview.summary}
            onRestart={interview.resetInterview}
          />
        ) : interview.phase === "summarizing" ? (
          <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
            <CardContent className="flex items-center gap-3 py-8">
              <Loader2 className="size-5 animate-spin text-blue-500" aria-hidden="true" />
              <span className="text-sm font-medium">
                Creating your interview summary...
              </span>
            </CardContent>
          </Card>
        ) : latestQuestion ? (
          <InterviewSession
            question={latestQuestion}
            questionIndex={interview.currentIndex}
            totalQuestions={interview.questions.length}
            records={interview.records}
            progress={interview.progress}
            answeredCount={interview.answeredCount}
            skippedCount={interview.skippedCount}
            isEvaluating={interview.isEvaluating}
            onSubmit={interview.submitAnswer}
            onSkip={interview.skipQuestion}
            onEnd={interview.endInterview}
          />
        ) : null}
      </div>
    </main>
  );
}
