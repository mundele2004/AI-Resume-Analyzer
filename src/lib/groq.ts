import Groq from "groq-sdk";

export type AtsAnalysis = {
  atsScore: number;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type JobMatchAnalysis = {
  matchScore: number;
  matchedSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
};

export type InterviewQuestionsAnalysis = {
  technicalQuestions: string[];
  projectQuestions: string[];
  behavioralQuestions: string[];
};

export type InterviewAnswer = {
  answer: string;
};

const MODEL_NAME = "llama-3.3-70b-versatile";
const GROQ_FALLBACK_STATUSES = new Set([429, 500, 503]);

const SYSTEM_PROMPT =
  "You are an ATS resume evaluator.\nAnalyze the resume and return valid JSON only.";
const JOB_MATCH_SYSTEM_PROMPT =
  "You are an ATS job description matching evaluator.\nCompare the resume to the job description and return valid JSON only.";
const INTERVIEW_QUESTIONS_SYSTEM_PROMPT =
  "You are an interview preparation coach.\nGenerate personalized interview questions and return valid JSON only.";
const INTERVIEW_ANSWER_SYSTEM_PROMPT =
  "You are an interview preparation coach.\nGenerate an ideal interview answer and return valid JSON only.";
const JOB_MATCH_SCORING_GUIDE = `Score calibration:
- 85-95: Strong match. Most required skills, technologies, relevant projects, experience, and education signals are present.
- 70-84: Good match. Several important requirements match, with some missing keywords or secondary gaps.
- 50-69: Partial match. Some clear overlap exists, but important skills or experience are missing.
- Below 50: Major skill gaps. Few required skills or role signals are present.

Scoring rules:
- Matched skills and technologies should significantly increase the score.
- Relevant projects, work experience, domain experience, and education should increase the score when they align with the job description.
- Missing keywords should reduce the score, but they must not automatically force an extremely low score when multiple important skills clearly match.
- Calibrate the score based on the whole resume-to-job overlap. Do not assign an arbitrary or overly harsh score.
- Identify concrete matched skills from both the resume and job description.
- Identify missing keywords that are actually present in the job description and absent or weak in the resume.
- Generate realistic, actionable recommendations.`;

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

function validateJobMatchAnalysis(value: unknown): JobMatchAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Groq job match response was not a JSON object.");
  }

  const analysis = value as Partial<JobMatchAnalysis>;

  if (
    typeof analysis.matchScore !== "number" ||
    !Number.isFinite(analysis.matchScore) ||
    analysis.matchScore < 0 ||
    analysis.matchScore > 100
  ) {
    throw new Error("Groq job match response included an invalid match score.");
  }

  if (
    !isStringArray(analysis.matchedSkills) ||
    !isStringArray(analysis.missingKeywords) ||
    !isStringArray(analysis.recommendations)
  ) {
    throw new Error("Groq job match response included invalid list fields.");
  }

  return {
    matchScore: Math.round(analysis.matchScore),
    matchedSkills: analysis.matchedSkills,
    missingKeywords: analysis.missingKeywords,
    recommendations: analysis.recommendations,
  };
}

function validateInterviewQuestionsAnalysis(
  value: unknown
): InterviewQuestionsAnalysis {
  if (!value || typeof value !== "object") {
    throw new Error("Groq interview questions response was not a JSON object.");
  }

  const analysis = value as Partial<InterviewQuestionsAnalysis>;

  if (
    !isStringArray(analysis.technicalQuestions) ||
    !isStringArray(analysis.projectQuestions) ||
    !isStringArray(analysis.behavioralQuestions)
  ) {
    throw new Error(
      "Groq interview questions response included invalid list fields."
    );
  }

  return {
    technicalQuestions: analysis.technicalQuestions,
    projectQuestions: analysis.projectQuestions,
    behavioralQuestions: analysis.behavioralQuestions,
  };
}

function validateInterviewAnswer(value: unknown): InterviewAnswer {
  if (!value || typeof value !== "object") {
    throw new Error("Groq interview answer response was not a JSON object.");
  }

  const analysis = value as Partial<InterviewAnswer>;

  if (typeof analysis.answer !== "string" || !analysis.answer.trim()) {
    throw new Error("Groq interview answer response included an invalid answer.");
  }

  return {
    answer: analysis.answer.trim(),
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

export async function analyzeResumeJobMatch(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchAnalysis> {
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
        content: JOB_MATCH_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `${JOB_MATCH_SCORING_GUIDE}

Return JSON matching this schema:

{
"matchScore": number,
"matchedSkills": string[],
"missingKeywords": string[],
"recommendations": string[]
}

Resume text:
${resumeText}

Job description:
${jobDescription}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Groq job match response did not include content.");
  }

  const parsed = extractJsonObject(responseText);

  return validateJobMatchAnalysis(parsed);
}

export async function analyzeInterviewQuestions(
  resumeText: string,
  jobDescription?: string
): Promise<InterviewQuestionsAnalysis> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const targetRoleContext = jobDescription?.trim()
    ? `Tailor the questions to this target role and job description:
${jobDescription.trim()}`
    : "No job description was provided. Generate questions only from the resume.";

  const client = new Groq({ apiKey });
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Analyze the candidate's projects, technologies, experience, and education from the resume.
If a job description is provided, also analyze the target role and tailor the questions to that role.
Generate realistic interview questions a recruiter, hiring manager, or technical interviewer could ask.

Return JSON matching this schema:

{
"technicalQuestions": string[],
"projectQuestions": string[],
"behavioralQuestions": string[]
}

Technical questions should test technologies, fundamentals, tools, frameworks, and engineering concepts.
Project questions should reference resume projects, implementation choices, architecture, tradeoffs, debugging, and outcomes.
Behavioral questions should cover collaboration, learning, problem-solving, ambiguity, ownership, and communication.

Resume text:
${resumeText}

${targetRoleContext}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Groq interview questions response did not include content.");
  }

  const parsed = extractJsonObject(responseText);

  return validateInterviewQuestionsAnalysis(parsed);
}

export async function generateInterviewAnswer({
  question,
  resumeText,
  jobDescription,
}: {
  question: string;
  resumeText: string;
  jobDescription?: string;
}): Promise<InterviewAnswer> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const targetRoleContext = jobDescription?.trim()
    ? `Use this target job description when tailoring the answer:
${jobDescription.trim()}`
    : "No job description was provided. Use only the resume context.";

  const client = new Groq({ apiKey });
  const completion = await client.chat.completions.create({
    model: MODEL_NAME,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: INTERVIEW_ANSWER_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Generate a realistic 2-3 minute interview answer for this question.
Use candidate resume context, project details, technologies, experience, and education.
If a job description is provided, tailor the answer to the target role.
Keep the answer professional, concise, specific, and first-person.
Do not invent impossible details. If specifics are missing, frame the answer generally while still using available resume context.

Return JSON matching this schema:

{
"answer": string
}

Interview question:
${question}

Resume text:
${resumeText}

${targetRoleContext}`,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error("Groq interview answer response did not include content.");
  }

  const parsed = extractJsonObject(responseText);

  return validateInterviewAnswer(parsed);
}
