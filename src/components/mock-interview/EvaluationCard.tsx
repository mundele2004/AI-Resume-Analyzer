import { CheckCircle2, Lightbulb, Target, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewEvaluation } from "@/types/interview";

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "red" | "amber";
}) {
  const Icon = tone === "green" ? CheckCircle2 : tone === "red" ? XCircle : Lightbulb;
  const iconClass =
    tone === "green"
      ? "text-emerald-500"
      : tone === "red"
        ? "text-rose-500"
        : "text-amber-500";

  return (
    <div className="grid gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className={`size-4 ${iconClass}`} aria-hidden="true" />
        {title}
      </h3>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li>No details returned.</li>
        )}
      </ul>
    </div>
  );
}

export function EvaluationCard({ evaluation }: { evaluation: InterviewEvaluation }) {
  return (
    <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm dark:border-emerald-400/25 dark:bg-emerald-400/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Target className="size-5 text-emerald-500" aria-hidden="true" />
            Latest Evaluation
          </span>
          <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-slate-950 dark:text-emerald-200">
            {evaluation.score}/10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <ListBlock title="Strengths" items={evaluation.strengths} tone="green" />
        <ListBlock title="Weaknesses" items={evaluation.weaknesses} tone="red" />
        <div className="md:col-span-2">
          <ListBlock title="Improvements" items={evaluation.improvements} tone="amber" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
          <p className="mb-2 font-semibold text-slate-950 dark:text-slate-50">
            Ideal Answer
          </p>
          <p className="text-muted-foreground">{evaluation.idealAnswer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
