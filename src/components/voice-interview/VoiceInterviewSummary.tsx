import { RotateCcw, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VoiceInterviewSummary as VoiceInterviewSummaryType } from "@/types/voice-interview";

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function VoiceInterviewSummary({
  summary,
  onRestart,
}: {
  summary: VoiceInterviewSummaryType;
  onRestart: () => void;
}) {
  const scores = [
    ["Overall", summary.overallScore],
    ["Technical", summary.technicalScore],
    ["Communication", summary.communicationScore],
    ["Behavioral", summary.behavioralScore],
    ["Confidence", summary.confidenceScore],
  ] as const;

  return (
    <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Volume2 className="size-5 text-blue-500" aria-hidden="true" />
          Voice Interview Summary
        </CardTitle>
        <CardDescription>
          Spoken interview performance across content, delivery, and confidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-5">
          {scores.map(([label, score]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{score}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryList title="Strengths" items={summary.strengths} />
          <SummaryList title="Weaknesses" items={summary.weaknesses} />
          <SummaryList
            title="Recommended Topics"
            items={summary.recommendedTopics}
          />
          <SummaryList title="Next Steps" items={summary.nextSteps} />
        </div>
        <Button className="w-full sm:w-fit" onClick={onRestart}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Start Another Voice Interview
        </Button>
      </CardContent>
    </Card>
  );
}
