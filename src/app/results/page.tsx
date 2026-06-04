"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  ClipboardCheck,
  Code2,
  Download,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  PanelsTopLeft,
  Phone,
  BriefcaseBusiness,
  SearchCheck,
  Sparkles,
  Trophy,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { generateResumeReportPdf } from "@/lib/pdf-report";

const RESULTS_STORAGE_KEY = "ats-analysis-result";

type AtsAnalysis = {
  atsScore: number;
  breakdown: {
    contact: number;
    skills: number;
    projects: number;
    experience: number;
    education: number;
    keywords: number;
  };
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

type JobMatchAnalysis = {
  matchScore: number;
  matchedSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
};

type InterviewQuestionsAnalysis = {
  technicalQuestions: string[];
  projectQuestions: string[];
  behavioralQuestions: string[];
};

type StoredResults = {
  analysis: AtsAnalysis;
  jobMatch: JobMatchAnalysis | null;
  interviewQuestions: InterviewQuestionsAnalysis | null;
  resumeText: string;
  jobDescription: string;
  message: string | null;
  source: string | null;
};

type InterviewAnswerResponse =
  | { success: true; answer: string }
  | { success: false; error?: string };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStoredResults(value: unknown): value is StoredResults {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredResults>;
  const analysis = candidate.analysis;
  const breakdown = analysis?.breakdown;

  if (!analysis || !breakdown) {
    return false;
  }

  const validAnalysis =
    typeof analysis.atsScore === "number" &&
    typeof breakdown.contact === "number" &&
    typeof breakdown.skills === "number" &&
    typeof breakdown.projects === "number" &&
    typeof breakdown.experience === "number" &&
    typeof breakdown.education === "number" &&
    typeof breakdown.keywords === "number" &&
    isStringArray(analysis.skills) &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.weaknesses) &&
    isStringArray(analysis.suggestions);

  if (!validAnalysis) {
    return false;
  }

  if (typeof candidate.resumeText !== "string") {
    return false;
  }

  if (typeof candidate.jobDescription !== "string") {
    return false;
  }

  if (candidate.jobMatch == null) {
    return isValidInterviewQuestions(candidate.interviewQuestions);
  }

  const jobMatch = candidate.jobMatch as Partial<JobMatchAnalysis>;

  const validJobMatch =
    typeof jobMatch.matchScore === "number" &&
    isStringArray(jobMatch.matchedSkills) &&
    isStringArray(jobMatch.missingKeywords) &&
    isStringArray(jobMatch.recommendations);

  return (
    validJobMatch && isValidInterviewQuestions(candidate.interviewQuestions)
  );
}

function isValidInterviewQuestions(value: unknown) {
  if (value == null) {
    return true;
  }

  const interviewQuestions = value as Partial<InterviewQuestionsAnalysis>;

  return (
    isStringArray(interviewQuestions.technicalQuestions) &&
    isStringArray(interviewQuestions.projectQuestions) &&
    isStringArray(interviewQuestions.behavioralQuestions)
  );
}

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Strong ATS fit";
  }

  if (score >= 80) {
    return "Competitive profile";
  }

  if (score >= 70) {
    return "Good foundation";
  }

  return "Needs attention";
}

function getAtsGrade(score: number) {
  if (score >= 95) {
    return "A+";
  }

  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B+";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "text-emerald-500",
      chart: "#10b981",
      soft: "bg-emerald-500/10 border-emerald-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
      badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  if (score >= 80) {
    return {
      text: "text-blue-700 dark:text-blue-300",
      icon: "text-blue-500",
      chart: "#3b82f6",
      soft: "bg-blue-500/10 border-blue-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-blue-500",
      badge: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    };
  }

  if (score >= 70) {
    return {
      text: "text-amber-700 dark:text-amber-300",
      icon: "text-amber-500",
      chart: "#f59e0b",
      soft: "bg-amber-500/10 border-amber-500/25",
      progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      badge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    text: "text-rose-700 dark:text-rose-300",
    icon: "text-rose-500",
    chart: "#f43f5e",
    soft: "bg-rose-500/10 border-rose-500/25",
    progress: "[&_[data-slot=progress-indicator]]:bg-rose-500",
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
}

function getMatchLabel(score: number) {
  if (score >= 90) {
    return "Excellent Match";
  }

  if (score >= 85) {
    return "Strong Match";
  }

  if (score >= 65) {
    return "Partial Match";
  }

  return "Keyword gap detected";
}

function getScoreInterpretation(score: number) {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 80) {
    return "Competitive";
  }

  if (score >= 70) {
    return "Good";
  }

  return "Needs Improvement";
}

function getCandidateTier(score: number) {
  if (score >= 90) {
    return "Tier 1 Candidate";
  }

  if (score >= 80) {
    return "Competitive Candidate";
  }

  if (score >= 70) {
    return "Emerging Candidate";
  }

  return "Needs Resume Focus";
}

function getResumeVerdict(analysis: AtsAnalysis) {
  const primaryImprovement =
    analysis.weaknesses[0]?.replace(/\.$/, "") ?? "role-specific keywords";

  if (analysis.atsScore >= 90) {
    return {
      title: "Competitive Profile",
      summary:
        "Strong technical foundation with relevant resume signals and a polished ATS structure.",
      improvement: primaryImprovement,
      recommendedFor:
        "Internships, entry-level software roles, and targeted technical applications.",
    };
  }

  if (analysis.atsScore >= 70) {
    return {
      title: "Promising Candidate",
      summary:
        "Good resume foundation with clear strengths and a few optimization opportunities.",
      improvement: primaryImprovement,
      recommendedFor:
        "Entry-level roles after tightening keywords, impact, and missing sections.",
    };
  }

  return {
    title: "Needs Focused Optimization",
    summary:
      "The resume has useful signals, but important ATS-friendly details need to be clearer.",
    improvement: primaryImprovement,
    recommendedFor:
      "Early applications after improving structure, measurable impact, and core role keywords.",
  };
}

function subscribeToStoredResults(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredResultsSnapshot() {
  return sessionStorage.getItem(RESULTS_STORAGE_KEY);
}

function getServerStoredResultsSnapshot() {
  return null;
}

function parseStoredResults(stored: string | null) {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    return isStoredResults(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function ResultList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <EmptyInlineState
        title="Nothing to show yet"
        description="This section will fill in once the analysis finds relevant resume signals."
      />
    );
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return (
      <EmptyInlineState
        title="No skills detected"
        description="Add a clear skills section with role-relevant technologies to improve keyword visibility."
      />
    );
  }

  const categories = [
    {
      title: "Frontend",
      values: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Tailwind"],
      className:
        "border-blue-500/25 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:text-blue-300",
    },
    {
      title: "Backend",
      values: ["Java", "Spring Boot", "REST APIs", "REST API", "Node.js", "Express"],
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      title: "Database",
      values: ["PostgreSQL", "MySQL", "MongoDB", "SQL"],
      className:
        "border-orange-500/25 bg-orange-500/10 text-orange-700 hover:bg-orange-500/15 dark:text-orange-300",
    },
    {
      title: "DevOps",
      values: ["Docker", "Vercel", "Git", "AWS", "Azure", "GCP"],
      className:
        "border-violet-500/25 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:text-violet-300",
    },
    {
      title: "Languages",
      values: ["Java", "Python", "C++", "C", "JavaScript", "TypeScript"],
      className:
        "border-slate-500/25 bg-slate-500/10 text-slate-700 hover:bg-slate-500/15 dark:text-slate-300",
    },
  ];
  const normalizedSkills = new Set(skills.map((skill) => skill.toLowerCase()));
  const categorized = categories
    .map((category) => ({
      ...category,
      skills: category.values.filter((skill) =>
        normalizedSkills.has(skill.toLowerCase())
      ),
    }))
    .filter((category) => category.skills.length > 0);
  const categorizedSkills = new Set(
    categorized.flatMap((category) =>
      category.skills.map((skill) => skill.toLowerCase())
    )
  );
  const uncategorized = skills.filter(
    (skill) => !categorizedSkills.has(skill.toLowerCase())
  );

  const visibleLimit = 5;

  return (
    <div className="grid gap-3">
      {categorized.map((category) => (
        <div key={category.title} className="grid gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {category.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {category.skills.slice(0, visibleLimit).map((skill) => (
              <span
                key={`${category.title}-${skill}`}
                className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-[1.01] ${category.className}`}
              >
                {skill}
              </span>
            ))}
            {category.skills.length > visibleLimit && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                +{category.skills.length - visibleLimit} more
              </span>
            )}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div className="grid gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Other
          </p>
          <div className="flex flex-wrap gap-2">
            {uncategorized.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
              >
                {skill}
              </span>
            ))}
            {uncategorized.length > 8 && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                +{uncategorized.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WarningChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return (
      <EmptyInlineState
        title="No missing keywords"
        description="The analysis did not identify missing job-description terms."
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center rounded-md border border-amber-300/70 bg-amber-100/80 px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function EmptyInlineState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-background/70 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ResumeVerdictCard({ analysis }: { analysis: AtsAnalysis }) {
  const verdict = getResumeVerdict(analysis);

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-sky-500" aria-hidden="true" />
          Resume Verdict
        </CardTitle>
        <CardDescription className="text-slate-500">{verdict.title}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 border-l-4 border-blue-500 text-sm leading-6">
        <p className="text-base font-medium text-slate-900">{verdict.summary}</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Primary improvement area
          </p>
          <p className="mt-1 text-muted-foreground">{verdict.improvement}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Recommended for
          </p>
          <p className="mt-1 text-muted-foreground">{verdict.recommendedFor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RecruiterSummary({ analysis }: { analysis: AtsAnalysis }) {
  const strengths =
    analysis.strengths.length > 0
      ? analysis.strengths.slice(0, 2)
      : ["Clear resume structure and baseline ATS readability."];
  const gaps =
    analysis.weaknesses.length > 0
      ? analysis.weaknesses.slice(0, 2)
      : ["Add more role-specific evidence where possible."];

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2">
          <BadgeCheck className="size-5 text-emerald-500" aria-hidden="true" />
          Recruiter Summary
        </CardTitle>
        <CardDescription>Fast scan for hiring review.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Strengths
          </p>
          <ul className="grid gap-2 text-sm leading-6">
            {strengths.map((item) => (
              <li
                key={`strength-${item}`}
                className="flex gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-emerald-950"
              >
                <BadgeCheck
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            Risks
          </p>
          <ul className="grid gap-2 text-sm leading-6">
            {gaps.map((item) => (
              <li
                key={`gap-${item}`}
                className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-amber-950"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function RadarChart({ analysis }: { analysis: AtsAnalysis }) {
  const metrics = [
    ["Contact", analysis.breakdown.contact, 10],
    ["Skills", analysis.breakdown.skills, 20],
    ["Projects", analysis.breakdown.projects, 25],
    ["Experience", analysis.breakdown.experience, 25],
    ["Education", analysis.breakdown.education, 10],
    ["Keywords", analysis.breakdown.keywords, 15],
  ] as const;
  const center = 210;
  const radius = 108;
  const getPoint = (index: number, percentage: number) => {
    const angle = -Math.PI / 2 + (index / metrics.length) * Math.PI * 2;
    const distance = radius * percentage;

    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
    };
  };
  const polygonPoints = metrics
    .map(([, value, max], index) => {
      const point = getPoint(index, Math.min(value / max, 1));

      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <Card className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PanelsTopLeft className="size-5 text-indigo-500" aria-hidden="true" />
          ATS Signal Radar
        </CardTitle>
        <CardDescription className="text-slate-500">
          Section strength across six scoring areas.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(180px,1fr)] lg:items-center">
        <div className="mx-auto aspect-square w-full max-w-[440px] p-4 sm:p-6">
          <svg
            viewBox="0 0 420 420"
            role="img"
            aria-label="Radar chart showing ATS section scores"
            className="h-full w-full overflow-visible"
          >
            {[0.25, 0.5, 0.75, 1].map((level) => (
              <polygon
                key={level}
                points={metrics
                  .map((_, index) => {
                    const point = getPoint(index, level);

                    return `${point.x},${point.y}`;
                  })
                  .join(" ")}
                className="fill-transparent stroke-slate-200"
                strokeWidth="1"
              />
            ))}
            {metrics.map(([label], index) => {
              const end = getPoint(index, 1);
              const labelPoint = getPoint(index, 1.32);

              return (
                <g key={label}>
                  <line
                    x1={center}
                    y1={center}
                    x2={end.x}
                    y2={end.y}
                    className="stroke-slate-200"
                    strokeWidth="1"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-600 text-[13px] font-semibold"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            <polygon
              points={polygonPoints}
              className="fill-indigo-500/20 stroke-indigo-500"
              strokeWidth="2"
            />
            {metrics.map(([, value, max], index) => {
              const point = getPoint(index, Math.min(value / max, 1));

              return (
                <circle
                  key={`${index}-${value}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className="fill-white stroke-indigo-500"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        <div className="grid gap-2.5">
          {metrics.map(([label, value, max]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm"
            >
              <span className="font-medium text-slate-700">{label}</span>
              <span className="font-semibold text-slate-950">
                {value}/{max}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBreakdown({ analysis }: { analysis: AtsAnalysis }) {
  const breakdownItems = [
    [
      "Contact",
      analysis.breakdown.contact,
      10,
      Phone,
      "Email, phone, and LinkedIn/GitHub signals.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-400 [&_[data-slot=progress-indicator]]:to-blue-600",
      "text-blue-500",
    ],
    [
      "Skills",
      analysis.breakdown.skills,
      20,
      Wrench,
      "Skills section presence and at least five technical skills.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-400 [&_[data-slot=progress-indicator]]:to-emerald-600",
      "text-emerald-500",
    ],
    [
      "Projects",
      analysis.breakdown.projects,
      25,
      PanelsTopLeft,
      "Projects section, multiple projects, and measurable impact.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-violet-400 [&_[data-slot=progress-indicator]]:to-violet-600",
      "text-violet-500",
    ],
    [
      "Experience",
      analysis.breakdown.experience,
      25,
      BriefcaseBusiness,
      "Experience section plus internship or job experience signals.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-amber-400 [&_[data-slot=progress-indicator]]:to-amber-600",
      "text-amber-500",
    ],
    [
      "Education",
      analysis.breakdown.education,
      10,
      GraduationCap,
      "Education section presence.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-cyan-400 [&_[data-slot=progress-indicator]]:to-cyan-600",
      "text-cyan-500",
    ],
    [
      "Keywords",
      analysis.breakdown.keywords,
      15,
      SearchCheck,
      "Common ATS keywords detected in the resume.",
      "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-indigo-400 [&_[data-slot=progress-indicator]]:to-indigo-600",
      "text-indigo-500",
    ],
  ] as const;

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="size-5 text-sky-500" aria-hidden="true" />
          Score Breakdown
        </CardTitle>
        <CardDescription className="text-slate-500">
          Weighted ATS scoring signals.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {breakdownItems.map(
          ([label, value, max, Icon, tooltip, progressClass, iconClass]) => (
          <div key={label} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <Icon className={`size-4 ${iconClass}`} aria-hidden="true" />
                {label}
                <span title={tooltip}>
                  <HelpCircle
                    className="size-3.5 text-muted-foreground"
                    aria-label={tooltip}
                  />
                </span>
              </span>
              <span className="text-sm font-medium text-slate-500">
                {value} / {max}
              </span>
            </div>
            <Progress
              value={(value / max) * 100}
              className={`h-2 bg-slate-100 ${progressClass}`}
            />
          </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

function OverviewCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  className,
  onClick,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Trophy;
  iconClassName: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <Card
      className={`rounded-2xl border shadow-sm shadow-slate-950/5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10 ${className}`}
      size="sm"
    >
      <CardContent className="relative flex items-center justify-between gap-4 py-4">
        <div
          className="pointer-events-none absolute right-3 top-3 size-16 rounded-full bg-white/50 blur-2xl"
          aria-hidden="true"
        />
        <button
          className="relative flex w-full items-center justify-between gap-4 text-left"
          onClick={onClick}
          type="button"
        >
          <span>
            <span className="text-sm font-semibold text-slate-500">
              {title}
            </span>
            <span className="mt-1 block text-5xl font-semibold tracking-normal text-slate-950 drop-shadow-sm">
              {value}
            </span>
            <span className="mt-2 inline-flex rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              {description}
            </span>
          </span>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/80 shadow-lg shadow-white/60 ring-1 ring-white/80 backdrop-blur">
            <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
          </span>
        </button>
      </CardContent>
    </Card>
  );
}

function EmptyTabState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon: typeof SearchCheck;
  action: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl rounded-2xl border border-dashed border-sky-200 bg-white shadow-sm shadow-slate-950/5">
      <CardHeader className="items-center text-center">
        <span className="grid size-12 place-items-center rounded-lg bg-muted">
          <Icon className="size-6 text-sky-500" aria-hidden="true" />
        </span>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="max-w-xl leading-6">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 text-center text-sm font-medium text-muted-foreground">
        {action}
      </CardContent>
    </Card>
  );
}

function JobMatchLockedState() {
  const unlockItems = [
    "Match Score",
    "Missing Keywords",
    "Matched Skills",
    "Personalized Recommendations",
    "Tailored Interview Questions",
  ];

  return (
    <Card className="rounded-2xl border border-dashed border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <CardHeader className="items-center text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-sky-500/10">
          <SearchCheck className="size-7 text-sky-500" aria-hidden="true" />
        </span>
        <CardTitle className="text-xl">No Job Match Yet</CardTitle>
        <CardDescription className="max-w-xl leading-6">
          Add a target job description to unlock match level, missing skills,
          and recruiter-focused recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="mx-auto grid w-full max-w-md gap-2 pb-6">
        {unlockItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <BadgeCheck className="size-4 text-emerald-500" aria-hidden="true" />
            {item}
          </div>
        ))}
        <Button asChild className="mt-3">
          <Link href="/">Analyze With Job Description</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function TopActionItems({ suggestions }: { suggestions: string[] }) {
  const actions = suggestions.slice(0, 3);

  return (
    <Card className="rounded-2xl border border-amber-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="size-5 text-amber-500" aria-hidden="true" />
          Top Action Items
        </CardTitle>
        <CardDescription className="text-slate-500">
          Fastest resume improvements to prioritize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {actions.length > 0 ? (
          <ol className="grid gap-2">
            {actions.map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyInlineState
            title="No action items returned"
            description="The report did not include specific next edits."
          />
        )}
      </CardContent>
    </Card>
  );
}

function getQuestionDifficulty(question: string, index: number) {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("architecture") ||
    lowerQuestion.includes("tradeoff") ||
    lowerQuestion.includes("scale") ||
    lowerQuestion.includes("debug") ||
    index >= 4
  ) {
    return "Hard";
  }

  if (
    lowerQuestion.includes("why") ||
    lowerQuestion.includes("how") ||
    lowerQuestion.includes("challenge") ||
    index >= 2
  ) {
    return "Medium";
  }

  return "Easy";
}

function getDifficultyClassName(difficulty: string) {
  if (difficulty === "Easy") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (difficulty === "Medium") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

function CollapsibleInsight({
  title,
  description,
  icon: Icon,
  iconClassName,
  items,
}: {
  title: string;
  description: string;
  icon: typeof BadgeCheck;
  iconClassName: string;
  items: string[];
}) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10" size="sm">
      <Accordion type="single" collapsible>
        <AccordionItem value={title} className="border-0 bg-transparent">
          <AccordionTrigger className="px-3 py-1 hover:bg-transparent">
            <span className="text-left">
              <span className="flex items-center gap-2 font-medium">
                <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
                {title} ({items.length})
              </span>
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                {description}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-3">
            <ResultList items={items} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function InterviewQuestionCategory({
  title,
  description,
  icon: Icon,
  iconClassName,
  questions,
  resumeText,
  jobDescription,
}: {
  title: string;
  description: string;
  icon: typeof Code2;
  iconClassName: string;
  questions: string[];
  resumeText: string;
  jobDescription: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});

  async function handleGenerateAnswer(question: string) {
    if (answers[question] || loadingQuestion) {
      return;
    }

    setLoadingQuestion(question);
    setAnswerErrors((current) => {
      const next = { ...current };
      delete next[question];
      return next;
    });

    try {
      const response = await fetch("/api/interview-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          resumeText,
          jobDescription,
        }),
      });
      const result = (await response.json()) as InterviewAnswerResponse;

      if (!result.success) {
        setAnswerErrors((current) => ({
          ...current,
          [question]: result.error ?? "Unable to generate an answer.",
        }));
        return;
      }

      setAnswers((current) => ({
        ...current,
        [question]: result.answer,
      }));
    } catch (error) {
      console.error("Interview answer generation failed:", error);
      setAnswerErrors((current) => ({
        ...current,
        [question]: "Unable to generate an answer. Please try again.",
      }));
    } finally {
      setLoadingQuestion(null);
    }
  }

  return (
    <AccordionItem
      value={title}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/10"
    >
      <AccordionTrigger className="px-4 py-4 hover:bg-white/60">
        <span className="flex min-w-0 items-center gap-3 text-left">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-slate-950">
              {title} ({questions.length})
            </span>
            <span className="mt-1 block text-sm font-normal text-slate-500">
              {description}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {questions.length > 0 ? (
          <Accordion type="multiple" className="grid gap-2">
            {questions.map((question, index) => (
              <AccordionItem
                key={question}
                value={`${title}-${index}`}
                className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                <AccordionTrigger className="px-3 py-3 hover:bg-slate-50">
                  <span className="flex flex-col gap-1 text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium leading-6 text-slate-900">
                        {question}
                      </span>
                      <span
                        className={`inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium ${getDifficultyClassName(
                          getQuestionDifficulty(question, index)
                        )}`}
                      >
                        {getQuestionDifficulty(question, index)}
                      </span>
                    </span>
                    {answers[question] && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Answer generated
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingQuestion === question}
                      onClick={() => handleGenerateAnswer(question)}
                    >
                      {answers[question]
                        ? "Answer Generated"
                        : loadingQuestion === question
                          ? "Generating..."
                          : "Generate Answer"}
                    </Button>
                    {answerErrors[question] && (
                      <span className="text-xs font-medium text-destructive">
                        {answerErrors[question]}
                      </span>
                    )}
                  </div>

                  {answers[question] && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-medium text-foreground">
                        AI Generated Answer
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {answers[question]}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <EmptyInlineState
            title="No questions generated"
            description="Try adding more project, technology, or experience details to create richer interview prep."
          />
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ResultsPage() {
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("ats");
  const storedResults = useSyncExternalStore(
    subscribeToStoredResults,
    getStoredResultsSnapshot,
    getServerStoredResultsSnapshot
  );
  const results = useMemo(() => parseStoredResults(storedResults), [storedResults]);
  const score = results?.analysis.atsScore ?? 0;
  const jobMatchScore = results?.jobMatch?.matchScore;
  const interviewQuestionCount = results?.interviewQuestions
    ? results.interviewQuestions.technicalQuestions.length +
      results.interviewQuestions.projectQuestions.length +
      results.interviewQuestions.behavioralQuestions.length
    : 0;
  const scoreLabel = useMemo(() => getScoreLabel(score), [score]);
  const scoreTone = useMemo(() => getScoreTone(score), [score]);
  const atsGrade = useMemo(() => getAtsGrade(score), [score]);
  const candidateTier = useMemo(() => getCandidateTier(score), [score]);
  async function handleDownloadReport() {
    if (!results || isDownloadingReport) {
      return;
    }

    setIsDownloadingReport(true);

    try {
      await Promise.resolve(generateResumeReportPdf(results));
    } finally {
      setIsDownloadingReport(false);
    }
  }

  if (!results) {
    return (
      <main className="min-h-screen bg-muted/30 px-6 py-10 text-foreground sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <Card className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <CardHeader>
              <CardTitle className="text-2xl">No results found</CardTitle>
              <CardDescription>
                Upload a resume to generate an ATS dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to upload
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 px-5 py-8 text-foreground sm:px-8">
      <div
        className="pointer-events-none absolute right-[-8rem] top-[-7rem] -z-10 size-80 rounded-full bg-blue-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[26rem] -z-10 size-96 -translate-x-1/2 rounded-full bg-violet-400/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-8rem] left-[-7rem] -z-10 size-80 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              ResumeAI
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Resume Intelligence Report
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted-foreground sm:text-base">
              A recruiter-readable dashboard for ATS strength, role fit, and
              interview preparation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["ATS Ready", "AI Powered", "Recruiter Insights"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur"
                  >
                    <BadgeCheck
                      className="mr-1.5 size-3.5 text-emerald-500"
                      aria-hidden="true"
                    />
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              className="h-10 w-full px-4 shadow-lg shadow-blue-950/10 sm:w-auto"
              disabled={isDownloadingReport}
              onClick={handleDownloadReport}
            >
              <Download className="size-4" aria-hidden="true" />
              {isDownloadingReport ? "Generating PDF..." : "Download Report"}
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Analyze another resume
              </Link>
            </Button>
          </div>
        </header>

        {results?.message && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
            {results.message}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <OverviewCard
            title="ATS Score"
            value={`${score}/100`}
            description={scoreLabel}
            icon={Trophy}
            iconClassName="text-blue-600"
            className="border-blue-200/80 bg-gradient-to-br from-white via-blue-50 to-sky-100/80"
            onClick={() => setActiveTab("ats")}
          />
          <OverviewCard
            title="Job Match Score"
            value={jobMatchScore == null ? "N/A" : `${jobMatchScore}/100`}
            description={
              jobMatchScore == null
                ? "Add a job description"
                : getMatchLabel(jobMatchScore)
            }
            icon={SearchCheck}
            iconClassName="text-emerald-600"
            className="border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50 to-teal-100/75"
            onClick={() => setActiveTab("job-match")}
          />
          <OverviewCard
            title="Interview Questions"
            value={`${interviewQuestionCount}`}
            description={
              interviewQuestionCount > 0
                ? "Personalized prompts"
                : "Run analysis to generate"
            }
            icon={MessageSquareText}
            iconClassName="text-violet-600"
            className="border-violet-200/80 bg-gradient-to-br from-white via-violet-50 to-fuchsia-100/70"
            onClick={() => setActiveTab("interview")}
          />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-3">
          <div className="overflow-x-auto pb-1">
            <TabsList>
              <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
              <TabsTrigger value="job-match">Job Match</TabsTrigger>
              <TabsTrigger value="interview">Interview Prep</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ats" className="grid gap-5">
            <section className="grid gap-5 xl:grid-cols-[520px_1fr]">
              <div className="grid gap-4">
                <Card className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50/70 to-sky-100/70 shadow-xl shadow-blue-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-950/15">
                  <CardHeader className="pb-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Trophy
                        className={`size-6 ${scoreTone.icon}`}
                        aria-hidden="true"
                      />
                      ATS Score
                    </CardTitle>
                    <CardDescription className={`text-base font-medium ${scoreTone.text}`}>
                      {getScoreInterpretation(score)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-end gap-3">
                        <span
                          className={`text-7xl font-semibold leading-none tracking-normal sm:text-8xl ${scoreTone.text}`}
                        >
                          {score}
                        </span>
                        <span className="pb-3 text-xl font-medium text-slate-500">
                          / 100
                        </span>
                      </div>
                      <div
                        className="grid size-36 shrink-0 place-items-center rounded-full shadow-inner sm:size-40"
                        style={{
                          background: `conic-gradient(${scoreTone.chart} ${score}%, var(--muted) 0)`,
                        }}
                        aria-label={`ATS score ${score} out of 100`}
                      >
                        <div className="grid size-24 place-items-center rounded-full bg-white ring-1 ring-blue-100 sm:size-28">
                          <span className={`text-2xl font-semibold ${scoreTone.text}`}>
                            {atsGrade}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-blue-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Grade
                        </p>
                        <p className="mt-1 text-3xl font-semibold text-slate-950">
                          {atsGrade}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3 shadow-sm backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Candidate Tier
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-950">
                          {candidateTier}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={score}
                      className={`h-3 bg-slate-100 ${scoreTone.progress}`}
                    />
                  </CardContent>
                </Card>

                <RadarChart analysis={results.analysis} />

                <TopActionItems suggestions={results.analysis.suggestions} />

                <ScoreBreakdown analysis={results.analysis} />
              </div>

              <div className="grid gap-4">
                <ResumeVerdictCard analysis={results.analysis} />

                <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <RecruiterSummary analysis={results.analysis} />

                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <ListChecks
                          className="size-5 text-sky-500"
                          aria-hidden="true"
                        />
                        Skills
                      </CardTitle>
                      <CardDescription>
                        {results.analysis.skills.length} detected keywords
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillChips skills={results.analysis.skills} />
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-3 lg:grid-cols-2">
                  <CollapsibleInsight
                    title="Strengths"
                    description="Positive resume signals"
                    icon={BadgeCheck}
                    iconClassName="text-emerald-500"
                    items={results.analysis.strengths}
                  />
                  <CollapsibleInsight
                    title="Weaknesses"
                    description="Gaps to review"
                    icon={CircleAlert}
                    iconClassName="text-rose-500"
                    items={results.analysis.weaknesses}
                  />
                </section>

                <CollapsibleInsight
                  title="Suggestions"
                  description="Highest-priority next edits"
                  icon={Lightbulb}
                  iconClassName="text-amber-500"
                  items={results.analysis.suggestions}
                />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="job-match" className="grid gap-4">
            {results.jobMatch ? (
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm shadow-slate-950/5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Match Level
                    </p>
                    <span className="mt-1 inline-flex rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {getMatchLabel(results.jobMatch.matchScore)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                      Matched Skills
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-900">
                      {results.jobMatch.matchedSkills.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      Missing Skills
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-amber-800">
                      {results.jobMatch.missingKeywords.length}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
                <Card className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/70 to-teal-100/60 shadow-lg shadow-emerald-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-950/15">
                  <CardHeader className="pb-0">
                    <CardTitle className="flex items-center gap-2">
                      <SearchCheck
                        className="size-5 text-sky-500"
                        aria-hidden="true"
                      />
                      Match Score
                    </CardTitle>
                    <CardDescription>
                      {getMatchLabel(results.jobMatch.matchScore)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <span className="text-6xl font-semibold tracking-normal text-emerald-900">
                        {results.jobMatch.matchScore}
                      </span>
                      <span className="pb-1.5 text-base font-medium text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <Progress
                      value={results.jobMatch.matchScore}
                      className="mt-4 h-2 bg-white/70 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-400 [&_[data-slot=progress-indicator]]:to-emerald-600"
                    />
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck
                          className="size-5 text-emerald-500"
                          aria-hidden="true"
                        />
                        Matched Skills
                      </CardTitle>
                      <CardDescription>
                        Skills aligned with the job.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillChips skills={results.jobMatch.matchedSkills} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <CircleAlert
                          className="size-5 text-rose-500"
                          aria-hidden="true"
                        />
                        Missing Keywords
                      </CardTitle>
                      <CardDescription>
                        Terms to consider adding truthfully.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WarningChips skills={results.jobMatch.missingKeywords} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
                    <CardHeader className="pb-0">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb
                          className="size-5 text-amber-500"
                          aria-hidden="true"
                        />
                        Recommendations
                      </CardTitle>
                      <CardDescription>
                        Targeted job-match improvements.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResultList items={results.jobMatch.recommendations} />
                    </CardContent>
                  </Card>
                </div>
                </div>
              </div>
            ) : (
              <JobMatchLockedState />
            )}
          </TabsContent>

          <TabsContent value="interview" className="grid gap-4">
            {results.interviewQuestions ? (
              <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/10">
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquareText
                      className="size-5 text-emerald-500"
                      aria-hidden="true"
                    />
                    Interview Questions
                  </CardTitle>
                  <CardDescription>
                    Expand a category, then open a question to generate or view
                    its answer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple">
                    <InterviewQuestionCategory
                      title="Technical Questions"
                      description="Focus: Java, Spring Boot, APIs"
                      icon={Code2}
                      iconClassName="text-sky-500"
                      questions={results.interviewQuestions.technicalQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                    <InterviewQuestionCategory
                      title="Project Questions"
                      description="Focus: Resume Projects"
                      icon={PanelsTopLeft}
                      iconClassName="text-violet-500"
                      questions={results.interviewQuestions.projectQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                    <InterviewQuestionCategory
                      title="Behavioral Questions"
                      description="Focus: Collaboration and Leadership"
                      icon={MessageSquareText}
                      iconClassName="text-emerald-500"
                      questions={results.interviewQuestions.behavioralQuestions}
                      resumeText={results.resumeText}
                      jobDescription={results.jobDescription}
                    />
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <EmptyTabState
                title="No interview prep yet"
                description="Interview prep appears after the analysis returns personalized question sets from the resume and optional job description."
                icon={MessageSquareText}
                action="Add clear projects, technologies, and experience details to get more targeted questions and stronger answer guidance."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
