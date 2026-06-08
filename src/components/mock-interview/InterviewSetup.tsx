"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, Clock, Gauge, Mic, Play, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_DURATIONS,
  INTERVIEW_MODES,
  JOB_ROLES,
  type InterviewDifficulty,
  type InterviewDuration,
  type InterviewMode,
  type InterviewSetupValues,
  type JobRole,
} from "@/types/interview";

export function InterviewSetup({
  onStart,
  isLoading,
  detectedSkills,
}: {
  onStart: (values: InterviewSetupValues) => void;
  isLoading?: boolean;
  detectedSkills: string[];
}) {
  const [role, setRole] = useState<JobRole>("Software Development Engineer");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] =
    useState<InterviewDifficulty>("Intermediate");
  const [duration, setDuration] = useState<InterviewDuration>(5);
  const [mode, setMode] = useState<InterviewMode>("Text Interview");
  const canStart = useMemo(
    () => role !== "Custom Role" || customRole.trim().length > 0,
    [customRole, role]
  );

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Play className="size-5 text-blue-500" aria-hidden="true" />
          AI Mock Interview
        </CardTitle>
        <CardDescription>
          Personalized from your resume, ATS analysis, skills, and target role.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="role">
            <BriefcaseBusiness className="size-4 text-blue-500" aria-hidden="true" />
            Job Role
          </label>
          <select
            id="role"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950"
            value={role}
            onChange={(event) => setRole(event.target.value as JobRole)}
          >
            {JOB_ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {role === "Custom Role" && (
            <input
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950"
              placeholder="Enter target role"
              value={customRole}
              onChange={(event) => setCustomRole(event.target.value)}
            />
          )}
        </div>

        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="size-4 text-emerald-500" aria-hidden="true" />
            Interview Difficulty
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {INTERVIEW_DIFFICULTIES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={difficulty === item ? "default" : "outline"}
                onClick={() => setDifficulty(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-amber-500" aria-hidden="true" />
            Interview Duration
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {INTERVIEW_DURATIONS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={duration === item ? "default" : "outline"}
                onClick={() => setDuration(item)}
              >
                {item} Questions
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Mic className="size-4 text-blue-500" aria-hidden="true" />
            Interview Mode
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTERVIEW_MODES.map((item) => {
              const Icon = item === "Text Interview" ? Type : Mic;

              return (
                <Button
                  key={item}
                  type="button"
                  variant={mode === item ? "default" : "outline"}
                  onClick={() => setMode(item)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Resume Signals
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {detectedSkills.slice(0, 10).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <Button
          className="h-10 w-full"
          disabled={isLoading || !canStart}
          onClick={() =>
            onStart({
              role,
              customRole,
              difficulty,
              duration,
              mode,
            })
          }
        >
          <Play className="size-4" aria-hidden="true" />
          {isLoading ? "Generating Interview..." : "Start Mock Interview"}
        </Button>
      </CardContent>
    </Card>
  );
}
