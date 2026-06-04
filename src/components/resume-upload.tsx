"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

type ParseResumeResponse =
  | { success: true; text: string }
  | { success: false; error?: string };

type AnalyzeResumeResponse =
  | {
      success: true;
      analysis: AtsAnalysis;
      jobMatch?: JobMatchAnalysis | null;
      interviewQuestions?: InterviewQuestionsAnalysis;
      message?: string;
      source?: string;
    }
  | { success: false; error?: string };

const ANALYSIS_BUTTON_STAGES = [
  "Extracting Resume...",
  "Analyzing ATS...",
  "Generating Insights...",
  "Preparing Questions...",
];

const ANALYSIS_PANEL_STEPS = [
  "Extracting resume content",
  "Evaluating ATS compatibility",
  "Generating personalized insights",
  "Preparing interview questions",
];

function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(megabytes >= 1 ? 1 : 2)} MB`;
}

function getValidationMessage(rejection: FileRejection) {
  const error = rejection.errors[0];

  if (!error) {
    return "Please upload a valid PDF resume.";
  }

  if (error.code === "file-invalid-type") {
    return "Only PDF files are accepted.";
  }

  if (error.code === "file-too-large") {
    return "Resume must be 5MB or smaller.";
  }

  return error.message;
}

export function ResumeUpload({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStageIndex, setAnalysisStageIndex] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        setSelectedFile(null);
        setErrors(fileRejections.map(getValidationMessage));
        return;
      }

      const file = acceptedFiles[0];

      if (file) {
        setSelectedFile(file);
        setErrors([]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
      multiple: false,
    });

  const canAnalyze = Boolean(selectedFile);

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    const interval = window.setInterval(() => {
      setAnalysisStageIndex(
        (current) => (current + 1) % ANALYSIS_BUTTON_STAGES.length
      );
    }, 1400);

    return () => window.clearInterval(interval);
  }, [isAnalyzing]);

  async function handleAnalyzeResume() {
    if (!selectedFile || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStageIndex(0);
    setErrors([]);
    const trimmedJobDescription = jobDescription.trim();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ParseResumeResponse;

      if (!result.success) {
        setErrors([result.error ?? "Unable to analyze this resume."]);
        return;
      }

      console.log("Extracted resume text:", result.text);

      const analysisResponse = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: result.text,
          jobDescription: trimmedJobDescription,
        }),
      });
      const analysisResult =
        (await analysisResponse.json()) as AnalyzeResumeResponse;

      if (!analysisResult.success) {
        setErrors([
          analysisResult.error ?? "Unable to analyze this resume with AI.",
        ]);
        return;
      }

      sessionStorage.setItem(
        RESULTS_STORAGE_KEY,
        JSON.stringify({
          analysis: analysisResult.analysis,
          jobMatch: analysisResult.jobMatch ?? null,
          interviewQuestions: analysisResult.interviewQuestions ?? null,
          resumeText: result.text,
          jobDescription: trimmedJobDescription,
          message: analysisResult.message ?? null,
          source: analysisResult.source ?? null,
        })
      );
      router.push("/results");
    } catch (error) {
      console.error("Resume analysis failed:", error);
      setErrors(["Unable to analyze this resume. Please try again."]);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStageIndex(0);
    }
  }

  const statusMessage = useMemo(() => {
    if (selectedFile) {
      return "Resume uploaded successfully";
    }

    if (isDragActive) {
      return "Release to upload your PDF resume";
    }

    return "PDF files only";
  }, [isDragActive, selectedFile]);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
      <div className="animate-reveal flex flex-col items-start gap-7">
        {children}

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            disabled={!canAnalyze || isAnalyzing}
            onClick={handleAnalyzeResume}
            className="h-12 min-w-48 px-6 text-base shadow-lg shadow-blue-950/10 transition-transform hover:-translate-y-0.5"
          >
            {isAnalyzing ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <UploadCloud className="size-5" aria-hidden="true" />
            )}
            {isAnalyzing
              ? ANALYSIS_BUTTON_STAGES[analysisStageIndex]
              : "Analyze Resume"}
          </Button>
          <Button
            variant="outline"
            className="h-12 bg-background/70 px-6 text-base backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            View Demo
          </Button>
        </div>
      </div>

      <section
        id="upload"
        aria-label="Resume upload"
        className="animate-reveal rounded-xl border bg-card/85 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur"
      >
        <div className="grid gap-4">
          <div
            {...getRootProps()}
            className={cn(
              "group flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-5 rounded-lg border-2 border-dashed border-border bg-muted/35 px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/70 hover:bg-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10",
              isDragActive && "border-blue-500/80 bg-blue-500/10 shadow-xl",
              isDragReject && "border-destructive/80 bg-destructive/10",
              selectedFile && "border-emerald-500/70 bg-emerald-500/5"
            )}
          >
            <input {...getInputProps()} aria-label="Upload PDF resume" />

            {selectedFile ? (
              <>
                <span className="flex size-16 items-center justify-center rounded-xl bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
                  <CheckCircle2
                    className="size-8 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                </span>
                <span className="space-y-2">
                  <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                    {statusMessage}
                  </span>
                  <span className="flex max-w-full items-center justify-center gap-2 text-lg font-semibold tracking-normal">
                    <FileText
                      className="size-5 shrink-0 text-sky-600 dark:text-sky-400"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-all">
                      {selectedFile.name}
                    </span>
                  </span>
                  <span className="block text-sm font-medium text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </span>
                <span className="rounded-lg bg-background px-3 py-1 text-sm font-medium text-muted-foreground ring-1 ring-border">
                  Click or drop another PDF to replace it
                </span>
              </>
            ) : (
              <>
                <span className="flex size-16 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
                  <UploadCloud
                    className="size-8 text-sky-600 dark:text-sky-400"
                    aria-hidden="true"
                  />
                </span>
                <span className="space-y-2">
                  <span className="block text-lg font-semibold tracking-normal">
                    Drop your resume here or click to browse
                  </span>
                  <span className="block text-sm font-medium text-muted-foreground">
                    {statusMessage}
                  </span>
                </span>
                <span className="rounded-lg bg-background px-3 py-1 text-sm font-medium text-muted-foreground ring-1 ring-border">
                  Max file size: 5MB
                </span>
              </>
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-foreground">
              Job description optional
            </span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the target job description here..."
              className="min-h-36 resize-y rounded-lg border bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>
        </div>

        {errors.length > 0 && (
          <div
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            role="alert"
          >
            {errors.map((error) => (
              <p key={error} className="flex items-center gap-2">
                <XCircle className="size-4" aria-hidden="true" />
                {error}
              </p>
            ))}
          </div>
        )}

        {isAnalyzing && (
          <div className="mt-4 rounded-lg border bg-background/85 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300">
                <span className="absolute size-11 animate-ping rounded-lg bg-blue-500/10" />
                <Bot className="relative size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  🤖 Analyzing your resume...
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {ANALYSIS_PANEL_STEPS.map((step) => (
                    <div
                      key={step}
                      className="flex items-center gap-2 rounded-lg border bg-card/80 px-3 py-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2
                        className="size-4 text-emerald-500"
                        aria-hidden="true"
                      />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
