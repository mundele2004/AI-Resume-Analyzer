import { CheckCircle2, Lightbulb, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewEvaluation } from "@/types/interview";

export function VoiceFeedbackCard({
  evaluation,
}: {
  evaluation: InterviewEvaluation | null;
}) {
  if (!evaluation) {
    return null;
  }

  return (
    <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/25 dark:bg-emerald-400/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Target className="size-5 text-emerald-500" aria-hidden="true" />
            Spoken Answer Feedback
          </span>
          <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-slate-950 dark:text-emerald-200">
            {evaluation.score}/10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Strengths
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {evaluation.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-amber-500" />
            Improvements
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground">
            {evaluation.improvements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
