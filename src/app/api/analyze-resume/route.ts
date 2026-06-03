import { NextResponse } from "next/server";

import {
  analyzeResumeWithGroq,
  generateLocalAtsAnalysis,
  shouldUseLocalAtsFallback,
} from "@/lib/groq";

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
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== "string" || !body.text.trim()) {
    return errorResponse("Resume text is required.", 400);
  }

  const resumeText = body.text.trim();

  try {
    const analysis = await analyzeResumeWithGroq(resumeText);

    return NextResponse.json({
      success: true,
      analysis,
      source: "groq",
    });
  } catch (error) {
    console.error("Groq analysis failed:", error);

    if (shouldUseLocalAtsFallback(error)) {
      return NextResponse.json({
        success: true,
        analysis: generateLocalAtsAnalysis(resumeText),
        source: "local",
        message:
          "AI analysis temporarily unavailable. Showing local ATS evaluation.",
      });
    }

    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return errorResponse(error.message, 500);
    }

    return errorResponse(
      "Unable to analyze this resume. Please try again.",
      500
    );
  }
}
