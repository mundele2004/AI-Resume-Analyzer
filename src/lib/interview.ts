import Groq from "groq-sdk";

import type {
  InterviewDifficulty,
  InterviewDuration,
  InterviewEvaluation,
  InterviewQuestion,
  InterviewSummary,
  MockInterviewContext,
} from "@/types/interview";

const MODEL_NAME = "llama-3.3-70b-versatile";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractJsonObject(responseText: string) {
  const trimmed = responseText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const startIndex = candidate.indexOf("{");
    const endIndex = candidate.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      throw new Error("AI response did not include a JSON object.");
    }

    return JSON.parse(candidate.slice(startIndex, endIndex + 1)) as unknown;
  }
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  return new Groq({ apiKey });
}

function validateQuestions(value: unknown): InterviewQuestion[] {
  if (!value || typeof value !== "object") {
    throw new Error("Interview generation response was not a JSON object.");
  }

  const candidate = value as { questions?: unknown };

  if (!Array.isArray(candidate.questions)) {
    throw new Error("Interview generation response did not include questions.");
  }

  return candidate.questions.map((item, index) => {
    const question = item as Partial<InterviewQuestion>;

    if (
      typeof question.question !== "string" ||
      !question.question.trim() ||
      !["technical", "project", "behavioral"].includes(String(question.type))
    ) {
      throw new Error("Interview generation response included an invalid question.");
    }

    return {
      id: typeof question.id === "string" ? question.id : `question-${index + 1}`,
      type: question.type as InterviewQuestion["type"],
      question: question.question.trim(),
      source: typeof question.source === "string" ? question.source : undefined,
      followUpDepth: 0,
    };
  });
}

function validateEvaluation(value: unknown): InterviewEvaluation {
  if (!value || typeof value !== "object") {
    throw new Error("Answer evaluation response was not a JSON object.");
  }

  const candidate = value as Partial<InterviewEvaluation>;

  if (
    typeof candidate.score !== "number" ||
    !Number.isFinite(candidate.score) ||
    !isStringArray(candidate.strengths) ||
    !isStringArray(candidate.weaknesses) ||
    typeof candidate.idealAnswer !== "string" ||
    !isStringArray(candidate.improvements)
  ) {
    throw new Error("Answer evaluation response included invalid fields.");
  }

  return {
    score: Math.max(0, Math.min(10, Math.round(candidate.score))),
    strengths: candidate.strengths,
    weaknesses: candidate.weaknesses,
    idealAnswer: candidate.idealAnswer,
    improvements: candidate.improvements,
    followUpQuestion:
      typeof candidate.followUpQuestion === "string" &&
      candidate.followUpQuestion.trim()
        ? candidate.followUpQuestion.trim()
        : null,
  };
}

function validateSummary(value: unknown): InterviewSummary {
  if (!value || typeof value !== "object") {
    throw new Error("Interview summary response was not a JSON object.");
  }

  const candidate = value as Partial<InterviewSummary>;

  if (
    typeof candidate.overallScore !== "number" ||
    typeof candidate.technicalScore !== "number" ||
    typeof candidate.communicationScore !== "number" ||
    typeof candidate.behavioralScore !== "number" ||
    !isStringArray(candidate.strengths) ||
    !isStringArray(candidate.weaknesses) ||
    !isStringArray(candidate.recommendedTopics) ||
    !isStringArray(candidate.nextSteps)
  ) {
    throw new Error("Interview summary response included invalid fields.");
  }

  const clamp = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

  return {
    overallScore: clamp(candidate.overallScore),
    technicalScore: clamp(candidate.technicalScore),
    communicationScore: clamp(candidate.communicationScore),
    behavioralScore: clamp(candidate.behavioralScore),
    strengths: candidate.strengths,
    weaknesses: candidate.weaknesses,
    recommendedTopics: candidate.recommendedTopics,
    nextSteps: candidate.nextSteps,
  };
}

export async function generateMockInterviewQuestions({
  context,
  role,
  difficulty,
  duration,
}: {
  context: MockInterviewContext;
  role: string;
  difficulty: InterviewDifficulty;
  duration: InterviewDuration;
}) {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior technical interviewer. Generate personalized mock interview questions and return valid JSON only.",
      },
      {
        role: "user",
        content: `Return JSON matching this schema:

{
  "questions": [
    {
      "id": "q1",
      "type": "technical" | "project" | "behavioral",
      "question": "string",
      "source": "string"
    }
  ]
}

Create exactly ${duration} questions for a ${difficulty} ${role} interview.
Balance technical, project, and behavioral questions. Technical questions must reflect skills, technologies, projects, and role expectations. Project questions must use resume project evidence where available. Behavioral questions must test collaboration, ownership, ambiguity, conflict resolution, and learning.

ATS score: ${context.atsAnalysis.atsScore}
Extracted skills: ${context.atsAnalysis.skills.join(", ")}
ATS strengths: ${context.atsAnalysis.strengths.join("; ")}
ATS weaknesses: ${context.atsAnalysis.weaknesses.join("; ")}
ATS suggestions: ${context.atsAnalysis.suggestions.join("; ")}
Job description context: ${context.jobDescription || "Not provided"}

Resume text:
${context.resumeText}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Interview generation response did not include content.");
  }

  return validateQuestions(extractJsonObject(responseText)).slice(0, duration);
}

export async function evaluateMockInterviewAnswer({
  context,
  question,
  answer,
  role,
  difficulty,
}: {
  context: MockInterviewContext;
  question: InterviewQuestion;
  answer: string;
  role: string;
  difficulty: InterviewDifficulty;
}) {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a strict but helpful interview evaluator. Return valid JSON only.",
      },
      {
        role: "user",
        content: `Evaluate this answer for a ${difficulty} ${role} interview.

Return JSON matching this schema:

{
  "score": number,
  "strengths": string[],
  "weaknesses": string[],
  "idealAnswer": "string",
  "improvements": string[],
  "followUpQuestion": "string or null"
}

The score must be from 0 to 10. Evaluate technical accuracy, communication, problem solving, completeness, and confidence. Include a follow-up question only when the answer is incomplete, shallow, or opens a useful deeper topic.

Question type: ${question.type}
Question: ${question.question}
Candidate answer: ${answer}

Resume skills: ${context.atsAnalysis.skills.join(", ")}
Resume text:
${context.resumeText}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Answer evaluation response did not include content.");
  }

  return validateEvaluation(extractJsonObject(responseText));
}

export async function summarizeMockInterview({
  context,
  role,
  difficulty,
  records,
}: {
  context: MockInterviewContext;
  role: string;
  difficulty: InterviewDifficulty;
  records: unknown;
}) {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an interview coach summarizing a completed mock interview. Return valid JSON only.",
      },
      {
        role: "user",
        content: `Create a final interview summary for a ${difficulty} ${role} mock interview.

Return JSON matching this schema:

{
  "overallScore": number,
  "technicalScore": number,
  "communicationScore": number,
  "behavioralScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "recommendedTopics": string[],
  "nextSteps": string[]
}

Scores must be 0 to 100. Use the candidate answers, skipped questions, answer evaluations, resume skills, and ATS analysis.

Resume skills: ${context.atsAnalysis.skills.join(", ")}
ATS weaknesses: ${context.atsAnalysis.weaknesses.join("; ")}
Interview records:
${JSON.stringify(records)}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Interview summary response did not include content.");
  }

  return validateSummary(extractJsonObject(responseText));
}
