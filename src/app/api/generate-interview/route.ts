import { NextResponse } from "next/server";

import { generateMockInterviewQuestions } from "@/lib/interview";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_DURATIONS,
  JOB_ROLES,
  type InterviewDifficulty,
  type InterviewDuration,
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
    customRole?: unknown;
    difficulty?: unknown;
    duration?: unknown;
  };

  if (!isContext(body.context)) {
    return errorResponse("Analyzed resume context is required.", 400);
  }

  if (typeof body.role !== "string" || !JOB_ROLES.includes(body.role as never)) {
    return errorResponse("Valid job role is required.", 400);
  }

  if (
    typeof body.difficulty !== "string" ||
    !INTERVIEW_DIFFICULTIES.includes(body.difficulty as InterviewDifficulty)
  ) {
    return errorResponse("Valid interview difficulty is required.", 400);
  }

  if (
    typeof body.duration !== "number" ||
    !INTERVIEW_DURATIONS.includes(body.duration as InterviewDuration)
  ) {
    return errorResponse("Valid interview duration is required.", 400);
  }

  const resolvedRole =
    body.role === "Custom Role" && typeof body.customRole === "string"
      ? body.customRole.trim()
      : body.role;

  if (!resolvedRole) {
    return errorResponse("Custom role is required.", 400);
  }

  try {
    const questions = await generateMockInterviewQuestions({
      context: {
        ...body.context,
        resumeText: body.context.resumeText.trim(),
      },
      role: resolvedRole,
      difficulty: body.difficulty as InterviewDifficulty,
      duration: body.duration as InterviewDuration,
    });

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Mock interview generation failed:", error);

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return errorResponse(error.message, 500);
    }

    return errorResponse("Unable to generate the mock interview.", 500);
  }
}
