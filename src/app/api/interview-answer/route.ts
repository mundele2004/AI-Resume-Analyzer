import { NextResponse } from "next/server";

import { generateInterviewAnswer } from "@/lib/groq";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    question?: unknown;
    resumeText?: unknown;
    jobDescription?: unknown;
  };

  if (typeof body.question !== "string" || !body.question.trim()) {
    return errorResponse("Interview question is required.", 400);
  }

  if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
    return errorResponse("Resume text is required.", 400);
  }

  const jobDescription =
    typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

  try {
    const answer = await generateInterviewAnswer({
      question: body.question.trim(),
      resumeText: body.resumeText.trim(),
      jobDescription,
    });

    return NextResponse.json({
      success: true,
      answer: answer.answer,
    });
  } catch (error) {
    console.error("Interview answer generation failed:", error);

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return errorResponse(error.message, 500);
    }

    return errorResponse(
      "Unable to generate an interview answer. Please try again.",
      500
    );
  }
}
