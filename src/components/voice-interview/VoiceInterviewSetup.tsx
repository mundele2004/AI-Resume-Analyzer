"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mic, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SpeechVoice } from "@/services/speech/SpeechSynthesisService";
import type { VoiceSetupValues } from "@/types/voice-interview";

export function VoiceInterviewSetup({
  initialSetup,
  voices,
  selectedVoiceId,
  isSpeechSupported,
  isTtsSupported,
  onVoiceChange,
  onStart,
}: {
  initialSetup: VoiceSetupValues | null;
  voices: SpeechVoice[];
  selectedVoiceId: string;
  isSpeechSupported: boolean;
  isTtsSupported: boolean;
  onVoiceChange: (voiceId: string) => void;
  onStart: (values: VoiceSetupValues) => void;
}) {
  const [setup] = useState<VoiceSetupValues>(
    initialSetup ?? {
      role: "Software Development Engineer",
      customRole: "",
      difficulty: "Intermediate",
      duration: 5,
      mode: "Voice Interview",
    }
  );

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Mic className="size-5 text-blue-500" aria-hidden="true" />
          Voice Mock Interview
        </CardTitle>
        <CardDescription>
          The interviewer will speak questions aloud and evaluate your spoken
          transcript.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {!isSpeechSupported && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Speech recognition is not supported in this browser. Use Text
            Interview mode, or type the transcript manually in the voice session.
          </div>
        )}
        {!isTtsSupported && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Speech synthesis is not supported in this browser. Questions will
            still appear as text.
          </div>
        )}

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Role
            </p>
            <p className="mt-1 font-medium">
              {setup.role === "Custom Role" ? setup.customRole : setup.role}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Difficulty
            </p>
            <p className="mt-1 font-medium">{setup.difficulty}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Questions
            </p>
            <p className="mt-1 font-medium">{setup.duration}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="voice">
            <Volume2 className="size-4 text-blue-500" aria-hidden="true" />
            Interviewer Voice
          </label>
          <select
            id="voice"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950"
            value={selectedVoiceId}
            onChange={(event) => onVoiceChange(event.target.value)}
          >
            {voices.length === 0 ? (
              <option value="">Default browser voice</option>
            ) : (
              voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => onStart(setup)}>
            <Mic className="size-4" aria-hidden="true" />
            Start Voice Interview
          </Button>
          <Button asChild variant="outline">
            <Link href="/mock-interview">
              Text Interview
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
