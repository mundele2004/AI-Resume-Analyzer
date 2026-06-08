import { NextResponse } from "next/server";

import { summarizeMockInterview } from "@/lib/interview";
import {
  INTERVIEW_DIFFICULTIES,
  type InterviewDifficulty,
  type MockInterviewContext,
} from "@/types/interview";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isContext(value: unknown): value is MockInterviewContext {
  const context = value as Partial<MockInterviewContext>;
  const analysis = context?.atsAnalysis;

  return (
    !!context &&
    typeof context.resumeText === "string" &&
    !!context.resumeText.trim() &&
    !!analysis &&
    typeof analysis.atsScore === "number" &&
    isStringArray(analysis.skills) &&
    isStringArray(analysis.strengths) &&
    isStringArray(analysis.weaknesses) &&
    isStringArray(analysis.suggestions)
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    context?: unknown;
    role?: unknown;
    difficulty?: unknown;
    records?: unknown;
  };

  if (!isContext(body.context)) {
    return errorResponse("Analyzed resume context is required.", 400);
  }

  if (typeof body.role !== "string" || !body.role.trim()) {
    return errorResponse("Job role is required.", 400);
  }

  if (
    typeof body.difficulty !== "string" ||
    !INTERVIEW_DIFFICULTIES.includes(body.difficulty as InterviewDifficulty)
  ) {
    return errorResponse("Valid interview difficulty is required.", 400);
  }

  if (!Array.isArray(body.records)) {
    return errorResponse("Interview records are required.", 400);
  }

  try {
    const summary = await summarizeMockInterview({
      context: body.context,
      role: body.role.trim(),
      difficulty: body.difficulty as InterviewDifficulty,
      records: body.records,
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Mock interview summary failed:", error);

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return errorResponse(error.message, 500);
    }

    return errorResponse("Unable to summarize this interview.", 500);
  }
}
