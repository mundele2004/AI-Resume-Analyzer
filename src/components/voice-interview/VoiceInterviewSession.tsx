"use client";

import { Loader2 } from "lucide-react";

import { MicrophoneStatus } from "@/components/voice-interview/MicrophoneStatus";
import { VoiceControls } from "@/components/voice-interview/VoiceControls";
import { VoiceFeedbackCard } from "@/components/voice-interview/VoiceFeedbackCard";
import { VoiceQuestionCard } from "@/components/voice-interview/VoiceQuestionCard";
import { Progress } from "@/components/ui/progress";
import type { useVoiceInterview } from "@/hooks/useVoiceInterview";

export function VoiceInterviewSession({
  interview,
}: {
  interview: ReturnType<typeof useVoiceInterview>;
}) {
  if (!interview.currentQuestion) {
    return null;
  }

  const busy =
    interview.phase === "processing" ||
    interview.phase === "generating" ||
    interview.phase === "summarizing";

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <VoiceQuestionCard
          question={interview.currentQuestion}
          current={interview.currentIndex + 1}
          total={interview.questions.length}
          isSpeaking={interview.isSpeaking}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Live Transcript</p>
            {busy && (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {interview.phase}
              </span>
            )}
          </div>
          <textarea
            className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950"
            placeholder="Your spoken transcript appears here. You can also type a fallback answer."
            value={interview.transcript}
            onChange={(event) => interview.setManualTranscript(event.target.value)}
          />
          <div className="mt-4 flex h-14 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950/70">
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                key={index}
                className={`w-1 rounded-full bg-emerald-500/70 ${
                  interview.isListening ? "animate-pulse" : ""
                }`}
                style={{ height: `${8 + ((index * 11) % 34)}px` }}
              />
            ))}
          </div>
        </div>
        <VoiceControls
          isListening={interview.isListening}
          isSpeaking={interview.isSpeaking}
          isPaused={interview.tts.isPaused}
          canSubmit={!!interview.transcript.trim()}
          onStartListening={interview.speech.startListening}
          onStopListening={interview.speech.stopListening}
          onSubmit={() => interview.submitTranscript()}
          onRetry={interview.speech.retry}
          onSkip={interview.skipQuestion}
          onEnd={interview.endInterview}
          onStopSpeaking={interview.tts.stop}
          onPauseSpeaking={interview.tts.pause}
          onResumeSpeaking={interview.tts.resume}
        />
        <VoiceFeedbackCard evaluation={interview.latestEvaluation} />
      </div>

      <div className="grid content-start gap-4">
        <MicrophoneStatus
          isListening={interview.isListening}
          status={interview.speech.status}
          unsupported={!interview.speech.isSupported}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-muted-foreground">{interview.progress}%</span>
          </div>
          <Progress value={interview.progress} className="h-2" />
          <p className="mt-3 text-xs text-muted-foreground">
            {interview.records.length} of {interview.questions.length} responses captured.
          </p>
        </div>
      </div>
    </div>
  );
}
