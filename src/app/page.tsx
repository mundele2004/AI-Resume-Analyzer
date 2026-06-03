import {
  Brain,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResumeUpload } from "@/components/resume-upload";

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
    </main>
  );
}
