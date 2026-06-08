import { ClipboardList } from "lucide-react";

import { Progress } from "@/components/ui/progress";

export function ProgressTracker({
  progress,
  answeredCount,
  skippedCount,
  totalQuestions,
}: {
  progress: number;
  answeredCount: number;
  skippedCount: number;
  totalQuestions: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="size-4 text-blue-500" aria-hidden="true" />
          Interview Progress
        </p>
        <p className="text-sm text-muted-foreground">{progress}%</p>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-lg bg-slate-100 px-2 py-2 dark:bg-slate-800">
          {totalQuestions} total
        </span>
        <span className="rounded-lg bg-emerald-100 px-2 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
          {answeredCount} answered
        </span>
        <span className="rounded-lg bg-amber-100 px-2 py-2 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
          {skippedCount} skipped
        </span>
      </div>
    </div>
  );
}
