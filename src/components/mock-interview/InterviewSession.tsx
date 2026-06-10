"use client";

import { useMemo, useState } from "react";
import { Loader2, LogOut, SkipForward } from "lucide-react";

import { AnswerBox } from "@/components/mock-interview/AnswerBox";
import { EvaluationCard } from "@/components/mock-interview/EvaluationCard";
import { ProgressTracker } from "@/components/mock-interview/ProgressTracker";
import { QuestionCard } from "@/components/mock-interview/QuestionCard";
import { Button } from "@/components/ui/button";
import type {
  InterviewAnswerRecord,
  InterviewQuestion,
  InterviewEvaluation,
} from "@/types/interview";

export function InterviewSession({
  question,
  questionIndex,
  totalQuestions,
  records,
  progress,
  answeredCount,
  skippedCount,
  isEvaluating,
  onSubmit,
  onSkip,
  onEnd,
}: {
  question: InterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  records: InterviewAnswerRecord[];
  progress: number;
  answeredCount: number;
  skippedCount: number;
  isEvaluating: boolean;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
  onEnd: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const latestEvaluation = useMemo<InterviewEvaluation | null>(() => {
    for (let index = records.length - 1; index >= 0; index -= 1) {
      if (records[index].evaluation) {
        return records[index].evaluation;
      }
    }

    return null;
  }, [records]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <QuestionCard
          question={question}
          questionNumber={questionIndex + 1}
          totalQuestions={totalQuestions}
        />
        <AnswerBox
          value={answer}
          disabled={isEvaluating}
          onChange={setAnswer}
          onSubmit={() => {
            onSubmit(answer);
            setAnswer("");
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" disabled={isEvaluating} onClick={onSkip}>
            <SkipForward className="size-4" aria-hidden="true" />
            Skip
          </Button>
          <Button variant="destructive" disabled={isEvaluating} onClick={onEnd}>
            <LogOut className="size-4" aria-hidden="true" />
            End Interview
          </Button>
          {isEvaluating && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Evaluating answer...
            </span>
          )}
        </div>
        {latestEvaluation && <EvaluationCard evaluation={latestEvaluation} />}
      </div>
      <ProgressTracker
        progress={progress}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}
