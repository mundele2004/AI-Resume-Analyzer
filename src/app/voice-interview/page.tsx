"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mic, Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoiceInterviewSession } from "@/components/voice-interview/VoiceInterviewSession";
import { VoiceInterviewSetup } from "@/components/voice-interview/VoiceInterviewSetup";
import { VoiceInterviewSummary } from "@/components/voice-interview/VoiceInterviewSummary";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_DURATIONS,
  JOB_ROLES,
  type AtsAnalysisContext,
  type MockInterviewContext,
} from "@/types/interview";
import type { VoiceSetupValues } from "@/types/voice-interview";

const RESULTS_STORAGE_KEY = "ats-analysis-result";
const SETUP_STORAGE_KEY = "mock-interview-setup";

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

function isVoiceSetup(value: unknown): value is VoiceSetupValues {
  const candidate = value as Partial<VoiceSetupValues>;

  return (
    !!candidate &&
    typeof candidate.role === "string" &&
    JOB_ROLES.includes(candidate.role as never) &&
    typeof candidate.customRole === "string" &&
    typeof candidate.difficulty === "string" &&
    INTERVIEW_DIFFICULTIES.includes(candidate.difficulty as never) &&
    typeof candidate.duration === "number" &&
    INTERVIEW_DURATIONS.includes(candidate.duration as never) &&
    candidate.mode === "Voice Interview"
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

function parseStoredSetup(stored: string | null): VoiceSetupValues | null {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    return isVoiceSetup(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getResultsSnapshot() {
  return sessionStorage.getItem(RESULTS_STORAGE_KEY);
}

function getSetupSnapshot() {
  return sessionStorage.getItem(SETUP_STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

function MissingContextState() {
  return (
    <Card className="rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-400/25 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>No analyzed resume found</CardTitle>
        <CardDescription>
          Analyze a resume first so the voice interview can use your ATS score,
          skills, and resume context.
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

export default function VoiceInterviewPage() {
  const storedResults = useSyncExternalStore(
    subscribeToStorage,
    getResultsSnapshot,
    getServerSnapshot
  );
  const storedSetup = useSyncExternalStore(
    subscribeToStorage,
    getSetupSnapshot,
    getServerSnapshot
  );
  const context = useMemo(() => parseStoredContext(storedResults), [storedResults]);
  const initialSetup = useMemo(() => parseStoredSetup(storedSetup), [storedSetup]);
  const interview = useVoiceInterview(context);
  const phaseLabel = useMemo(() => {
    if (interview.phase === "generating") {
      return "Generating questions";
    }

    if (interview.phase === "processing") {
      return "Processing answer";
    }

    if (interview.phase === "summarizing") {
      return "Building summary";
    }

    if (interview.isSpeaking) {
      return "Speaking";
    }

    if (interview.isListening) {
      return "Listening";
    }

    return "Ready";
  }, [interview.phase, interview.isListening, interview.isSpeaking]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_45%,#f8fafc_100%)] px-4 py-6 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.17),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] dark:text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {phaseLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Mic className="size-3.5" aria-hidden="true" />
                Browser voice APIs
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              AI Voice Mock Interview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Talk through personalized questions with speech recognition,
              spoken feedback, follow-ups, and a final voice-read summary.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/mock-interview">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Interview Setup
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
        ) : interview.phase === "setup" ? (
          <VoiceInterviewSetup
            initialSetup={initialSetup}
            voices={interview.tts.voices}
            selectedVoiceId={interview.tts.selectedVoiceId}
            isSpeechSupported={interview.speech.isSupported}
            isTtsSupported={interview.tts.isSupported}
            onVoiceChange={interview.tts.setSelectedVoiceId}
            onStart={interview.startInterview}
          />
        ) : interview.phase === "generating" ? (
          <Card className="rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-400/20 dark:bg-slate-900">
            <CardContent className="flex items-center gap-3 py-8">
              <Loader2 className="size-5 animate-spin text-emerald-500" aria-hidden="true" />
              <span className="text-sm font-medium">
                Preparing your voice interview...
              </span>
            </CardContent>
          </Card>
        ) : interview.phase === "complete" && interview.summary ? (
          <VoiceInterviewSummary
            summary={interview.summary}
            onRestart={interview.resetInterview}
          />
        ) : (
          <VoiceInterviewSession interview={interview} />
        )}
      </div>
    </main>
  );
}
