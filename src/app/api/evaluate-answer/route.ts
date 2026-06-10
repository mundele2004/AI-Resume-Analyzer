import { NextResponse } from "next/server";

import { evaluateMockInterviewAnswer } from "@/lib/interview";
import {
  INTERVIEW_DIFFICULTIES,
  type InterviewDifficulty,
  type InterviewQuestion,
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

function isQuestion(value: unknown): value is InterviewQuestion {
  const question = value as Partial<InterviewQuestion>;

  return (
    !!question &&
    typeof question.id === "string" &&
    typeof question.question === "string" &&
    ["technical", "project", "behavioral"].includes(String(question.type))
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    context?: unknown;
    question?: unknown;
    answer?: unknown;
    role?: unknown;
    difficulty?: unknown;
  };

  if (!isContext(body.context)) {
    return errorResponse("Analyzed resume context is required.", 400);
  }

  if (!isQuestion(body.question)) {
    return errorResponse("Interview question is required.", 400);
  }

  if (typeof body.answer !== "string" || !body.answer.trim()) {
    return errorResponse("Answer is required.", 400);
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

  try {
    const evaluation = await evaluateMockInterviewAnswer({
      context: body.context,
      question: body.question,
      answer: body.answer.trim(),
      role: body.role.trim(),
      difficulty: body.difficulty as InterviewDifficulty,
    });

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    console.error("Mock interview answer evaluation failed:", error);

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return errorResponse(error.message, 500);
    }

    return errorResponse("Unable to evaluate this answer.", 500);
  }
}
