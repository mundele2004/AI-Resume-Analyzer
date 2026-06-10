import { BadgeQuestionMark } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewQuestion } from "@/types/interview";

const typeLabels: Record<InterviewQuestion["type"], string> = {
  technical: "Technical",
  project: "Project",
  behavioral: "Behavioral",
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: {
  question: InterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
}) {
  return (
    <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm shadow-slate-950/5 dark:border-blue-400/20 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgeQuestionMark className="size-5 text-blue-500" aria-hidden="true" />
          Question {questionNumber} of {totalQuestions}
        </CardTitle>
        <CardDescription>
          {typeLabels[question.type]}
          {question.source ? ` · ${question.source}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium leading-8 text-slate-950 dark:text-slate-50">
          {question.question}
        </p>
      </CardContent>
    </Card>
  );
}
