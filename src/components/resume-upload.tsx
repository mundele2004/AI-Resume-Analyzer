"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";
import { CheckCircle2, FileText, UploadCloud, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const RESULTS_STORAGE_KEY = "ats-analysis-result";

type AtsAnalysis = {
  atsScore: number;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

type ParseResumeResponse =
  | { success: true; text: string }
  | { success: false; error?: string };

type AnalyzeResumeResponse =
  | { success: true; analysis: AtsAnalysis; message?: string; source?: string }
  | { success: false; error?: string };

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
  const [errors, setErrors] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const hasSelectedFile = Boolean(selectedFile);

  async function handleAnalyzeResume() {
    if (!selectedFile || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setErrors([]);

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
        body: JSON.stringify({ text: result.text }),
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
            disabled={!hasSelectedFile || isAnalyzing}
            onClick={handleAnalyzeResume}
            className="h-12 px-6 text-base shadow-lg shadow-blue-950/10 transition-transform hover:-translate-y-0.5"
          >
            <UploadCloud className="size-5" aria-hidden="true" />
            {isAnalyzing ? "Analyzing Resume..." : "Analyze Resume"}
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
        <div
          {...getRootProps()}
          className={cn(
            "group flex min-h-[380px] cursor-pointer flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-border bg-muted/35 px-6 py-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/70 hover:bg-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10",
            isDragActive && "border-blue-500/80 bg-blue-500/10 shadow-xl",
            isDragReject && "border-destructive/80 bg-destructive/10",
            selectedFile && "border-emerald-500/70 bg-emerald-500/5"
          )}
        >
          <input {...getInputProps()} aria-label="Upload PDF resume" />

          {selectedFile ? (
            <>
              <span className="flex size-20 items-center justify-center rounded-xl bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
                <CheckCircle2
                  className="size-10 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              </span>
              <span className="space-y-3">
                <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  {statusMessage}
                </span>
                <span className="flex max-w-full items-center justify-center gap-2 text-xl font-semibold tracking-normal">
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
              <span className="flex size-20 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
                <UploadCloud
                  className="size-10 text-sky-600 dark:text-sky-400"
                  aria-hidden="true"
                />
              </span>
              <span className="space-y-2">
                <span className="block text-xl font-semibold tracking-normal">
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

      </section>
    </div>
  );
}
