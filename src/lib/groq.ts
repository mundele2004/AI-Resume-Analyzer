import Groq from "groq-sdk";

export type AtsAnalysis = {
  atsScore: number;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

const MODEL_NAME = "llama-3.3-70b-versatile";
const GROQ_FALLBACK_STATUSES = new Set([429, 500, 503]);

const SYSTEM_PROMPT =
  "You are an ATS resume evaluator.\nAnalyze the resume and return valid JSON only.";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateAnalysis(value: unknown): AtsAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Groq response was not a JSON object.");
  }

  const analysis = value as Partial<AtsAnalysis>;

  if (
    typeof analysis.atsScore !== "number" ||
    !Number.isFinite(analysis.atsScore) ||
    analysis.atsScore < 0 ||
    analysis.atsScore > 100
  ) {
    throw new Error("Groq response included an invalid ATS score.");
  }

  if (
    !isStringArray(analysis.skills) ||
    !isStringArray(analysis.strengths) ||
    !isStringArray(analysis.weaknesses) ||
    !isStringArray(analysis.suggestions)
  ) {
    throw new Error("Groq response included invalid list fields.");
  }

  return {
    atsScore: Math.round(analysis.atsScore),
    skills: analysis.skills,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    suggestions: analysis.suggestions,
  };
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
      throw new Error("Groq response did not include a JSON object.");
    }

    return JSON.parse(candidate.slice(startIndex, endIndex + 1)) as unknown;
  }
}

function includesSection(resumeText: string, sectionName: string) {
  const pattern = new RegExp(
    `(^|\\n)\\s*${sectionName}s?\\s*:?\\s*(\\n|$)`,
    "i"
  );

  return pattern.test(resumeText);
}

function includesContactInfo(resumeText: string) {
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(resumeText);
  const hasProfile =
    /linkedin\.com|github\.com|portfolio|personal website|https?:\/\//i.test(
      resumeText
    );

  return hasEmail || hasPhone || hasProfile;
}

function extractSkills(resumeText: string) {
  const knownSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Tailwind CSS",
    "HTML",
    "CSS",
    "Python",
    "Java",
    "SQL",
    "AWS",
    "Docker",
    "Git",
    "REST API",
    "GraphQL",
  ];

  return knownSkills.filter((skill) => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(`\\b${escapedSkill}\\b`, "i").test(resumeText);
  });
}

export function generateLocalAtsAnalysis(resumeText: string): AtsAnalysis {
  const checks = [
    {
      key: "skills",
      label: "Skills section",
      points: 25,
      present: includesSection(resumeText, "skills"),
      suggestion: "Add a dedicated Skills section with role-relevant keywords.",
    },
    {
      key: "projects",
      label: "Projects section",
      points: 25,
      present: includesSection(resumeText, "projects"),
      suggestion: "Add a Projects section that shows measurable technical work.",
    },
    {
      key: "education",
      label: "Education section",
      points: 15,
      present: includesSection(resumeText, "education"),
      suggestion: "Add an Education section with degree, institution, and dates.",
    },
    {
      key: "experience",
      label: "Experience section",
      points: 20,
      present: includesSection(resumeText, "experience"),
      suggestion: "Add an Experience section with impact-focused bullet points.",
    },
    {
      key: "contact",
      label: "Contact information",
      points: 15,
      present: includesContactInfo(resumeText),
      suggestion:
        "Add clear contact information such as email, phone, LinkedIn, or portfolio.",
    },
  ];

  const atsScore = checks.reduce(
    (score, check) => score + (check.present ? check.points : 0),
    0
  );
  const strengths = checks
    .filter((check) => check.present)
    .map((check) => `${check.label} is present.`);
  const weaknesses = checks
    .filter((check) => !check.present)
    .map((check) => `${check.label} is missing or hard to detect.`);
  const suggestions = checks
    .filter((check) => !check.present)
    .map((check) => check.suggestion);
  const skills = extractSkills(resumeText);

  return {
    atsScore,
    skills:
      skills.length > 0 ? skills : ["No common technical skills detected"],
    strengths:
      strengths.length > 0
        ? strengths
        : ["Resume text was extracted successfully for local evaluation."],
    weaknesses,
    suggestions:
      suggestions.length > 0
        ? suggestions
        : [
            "Your resume includes the core ATS sections. Keep keywords aligned with the target job description.",
          ],
  };
}

export function shouldUseLocalAtsFallback(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };
  const status =
    candidate.status ?? candidate.statusCode ?? candidate.response?.status;

  return typeof status === "number" && GROQ_FALLBACK_STATUSES.has(status);
}

export async function analyzeResumeWithGroq(
  resumeText: string
): Promise<AtsAnalysis> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const client = new Groq({ apiKey });
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Return JSON matching this schema:

{
"atsScore": number,
"skills": string[],
"strengths": string[],
"weaknesses": string[],
"suggestions": string[]
}

Resume text:
${resumeText}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Groq response did not include content.");
  }

  const parsed = extractJsonObject(responseText);

  return validateAnalysis(parsed);
}
