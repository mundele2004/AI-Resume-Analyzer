"use client";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AnswerBox({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <textarea
        className="min-h-44 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950"
        placeholder="Answer as you would in a real interview..."
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex justify-end">
        <Button disabled={disabled || !value.trim()} onClick={onSubmit}>
          <Send className="size-4" aria-hidden="true" />
          Submit Answer
        </Button>
      </div>
    </div>
  );
}
