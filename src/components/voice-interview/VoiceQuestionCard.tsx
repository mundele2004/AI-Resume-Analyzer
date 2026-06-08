import { AudioLines, MessageCircleQuestion } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewQuestion } from "@/types/interview";

export function VoiceQuestionCard({
  question,
  current,
  total,
  isSpeaking,
}: {
  question: InterviewQuestion;
  current: number;
  total: number;
  isSpeaking: boolean;
}) {
  return (
    <Card className="rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-400/20 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="size-5 text-blue-500" aria-hidden="true" />
          Question {current} of {total}
        </CardTitle>
        <CardDescription>
          {question.type} {question.source ? `· ${question.source}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-lg font-medium leading-8 text-slate-950 dark:text-slate-50">
          {question.question}
        </p>
        <div className="flex h-16 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-slate-950/70">
          {Array.from({ length: 28 }).map((_, index) => (
            <span
              key={index}
              className={`w-1 rounded-full bg-blue-500/70 ${isSpeaking ? "animate-pulse" : ""}`}
              style={{ height: `${14 + ((index * 7) % 34)}px` }}
            />
          ))}
          <span className="ml-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <AudioLines className="size-4" aria-hidden="true" />
            {isSpeaking ? "AI speaking..." : "Voice prompt ready"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
