import { RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewSummary as InterviewSummaryType } from "@/types/interview";

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RadarChart({ summary }: { summary: InterviewSummaryType }) {
  const metrics = [
    ["Overall", summary.overallScore],
    ["Technical", summary.technicalScore],
    ["Communication", summary.communicationScore],
    ["Behavioral", summary.behavioralScore],
  ] as const;
  const center = 95;
  const radius = 70;
  const points = metrics
    .map(([, value], index) => {
      const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
      const distance = radius * (value / 100);

      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 190 190" className="mx-auto size-56 max-w-full">
      {[0.35, 0.7, 1].map((scale) => (
        <polygon
          key={scale}
          points={metrics
            .map(([,], index) => {
              const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
              const distance = radius * scale;

              return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
            })
            .join(" ")}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
        />
      ))}
      <polygon
        points={points}
        fill="rgb(59 130 246 / 0.22)"
        stroke="rgb(59 130 246)"
        strokeWidth="3"
      />
      {metrics.map(([label, value], index) => {
        const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
        const x = center + Math.cos(angle) * 86;
        const y = center + Math.sin(angle) * 86;

        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-600 text-[10px] font-semibold dark:fill-slate-300"
          >
            {label} {value}
          </text>
        );
      })}
    </svg>
  );
}

export function InterviewSummary({
  summary,
  onRestart,
}: {
  summary: InterviewSummaryType;
  onRestart: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm shadow-slate-950/5 dark:border-blue-400/20 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="size-5 text-blue-500" aria-hidden="true" />
          Interview Summary
        </CardTitle>
        <CardDescription>
          Overall score, communication signal, technical depth, and next steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-400/25 dark:bg-blue-400/10">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">
              Overall Score
            </p>
            <p className="mt-2 text-6xl font-semibold text-blue-900 dark:text-blue-100">
              {summary.overallScore}
            </p>
            <p className="text-sm text-muted-foreground">/ 100</p>
            <RadarChart summary={summary} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Technical", summary.technicalScore],
              ["Communication", summary.communicationScore],
              ["Behavioral", summary.behavioralScore],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70"
              >
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryList title="Strength Areas" items={summary.strengths} />
          <SummaryList title="Weak Areas" items={summary.weaknesses} />
          <SummaryList
            title="Recommended Study Topics"
            items={summary.recommendedTopics}
          />
          <SummaryList title="Next Steps" items={summary.nextSteps} />
        </div>

        <Button className="w-full sm:w-fit" onClick={onRestart}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Start Another Interview
        </Button>
      </CardContent>
    </Card>
  );
}
