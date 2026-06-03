import {
  Brain,
  BriefcaseBusiness,
  ClipboardCheck,
  FileSearch,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResumeUpload } from "@/components/resume-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "ATS Score Analysis",
    description:
      "See how your resume performs against applicant tracking systems with a clear, recruiter-ready score.",
    icon: ClipboardCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Resume Feedback",
    description:
      "Get targeted suggestions for stronger bullet points, cleaner structure, and sharper professional impact.",
    icon: FileSearch,
    tone: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    title: "Job Description Matching",
    description:
      "Compare your resume to job posts and uncover missing keywords, skills, and experience signals.",
    icon: BriefcaseBusiness,
    tone: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Interview Question Generator",
    description:
      "Prepare with role-specific questions based on your resume, experience, and target position.",
    icon: MessageSquareText,
    tone: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
];

const stats = [
  ["10,000+", "Resumes Analyzed"],
  ["95%", "ATS Accuracy"],
  ["500+", "Hiring Managers Inspired"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.18),transparent_38%),linear-gradient(135deg,rgba(248,250,252,0.96),rgba(239,246,255,0.88)_48%,rgba(245,243,255,0.92))] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.2),transparent_38%),linear-gradient(135deg,rgba(10,10,10,1),rgba(17,24,39,0.96)_52%,rgba(30,27,75,0.78))]">
        <div
          className="pointer-events-none absolute left-1/2 top-24 -z-10 h-52 w-[38rem] -translate-x-1/2 rotate-[-6deg] rounded-[48px] bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-sky-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="floating-shape pointer-events-none absolute right-10 top-40 -z-10 hidden size-24 rotate-12 rounded-xl border border-blue-400/20 bg-white/30 shadow-2xl shadow-blue-500/10 backdrop-blur-md dark:bg-white/5 lg:block"
          aria-hidden="true"
        />
        <div
          className="floating-shape pointer-events-none absolute bottom-20 left-10 -z-10 hidden size-16 rotate-45 rounded-lg border border-violet-400/20 bg-white/25 shadow-xl shadow-violet-500/10 backdrop-blur-md dark:bg-white/5 lg:block"
          aria-hidden="true"
        />

        <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
            <a href="#" className="flex items-center gap-2 font-semibold">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Brain className="size-5" aria-hidden="true" />
              </span>
              ResumeAI
            </a>
            <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
              <a href="#upload" className="transition-colors hover:text-foreground">
                Upload
              </a>
              <a href="#stats" className="transition-colors hover:text-foreground">
                Results
              </a>
              <a href="#features" className="transition-colors hover:text-foreground">
                Features
              </a>
            </div>
            <Button variant="outline" className="hidden sm:inline-flex">
              View Demo
            </Button>
          </div>
        </nav>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <ResumeUpload>
            <div className="inline-flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-sky-500" aria-hidden="true" />
              AI-powered resume intelligence
            </div>

            <div className="relative space-y-5">
              <div
                className="pointer-events-none absolute -left-6 top-4 -z-10 h-28 w-80 rounded-[40px] bg-gradient-to-r from-blue-500/25 to-violet-500/25 blur-2xl"
                aria-hidden="true"
              />
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
                Optimize Your Resume with{" "}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-sky-500 bg-clip-text text-transparent dark:from-blue-300 dark:via-violet-300 dark:to-sky-300">
                  AI
                </span>
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-8 text-muted-foreground sm:text-xl">
                Get ATS scores, personalized feedback, and job matching
                insights in seconds.
              </p>
            </div>
          </ResumeUpload>
        </div>
      </section>

      <section id="stats" className="border-y bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="animate-reveal rounded-lg border bg-card px-5 py-6 text-center shadow-sm"
            >
              <p className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="relative border-t bg-muted/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/8 to-transparent"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="animate-reveal mb-8 max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              Recruiter-ready insights
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              Everything you need to tailor your next application
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Practical AI insights for resumes, job descriptions, and
              interview prep in one focused workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="animate-reveal rounded-lg border bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-950/10 dark:hover:shadow-blue-500/10"
                >
                  <CardHeader className="gap-4">
                    <span
                      className={`flex size-11 items-center justify-center rounded-lg ${feature.bg} transition-transform duration-300 group-hover/card:scale-110`}
                    >
                      <Icon
                        className={`size-5 ${feature.tone}`}
                        aria-hidden="true"
                      />
                    </span>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
