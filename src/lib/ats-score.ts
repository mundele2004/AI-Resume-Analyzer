export type AtsScoreBreakdown = {
  contact: number;
  skills: number;
  projects: number;
  experience: number;
  education: number;
  keywords: number;
};

export type AtsScoreResult = {
  atsScore: number;
  breakdown: AtsScoreBreakdown;
};

const ATS_KEYWORDS = [
  "React",
  "Next.js",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Java",
  "Spring Boot",
  "Python",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Git",
  "AWS",
  "REST API",
];

const TECHNICAL_SKILLS = [
  ...ATS_KEYWORDS,
  "HTML",
  "CSS",
  "Tailwind CSS",
  "GraphQL",
  "Express",
  "Django",
  "Flask",
  "MySQL",
  "Redis",
  "Kubernetes",
  "Azure",
  "GCP",
  "Firebase",
  "Linux",
  "Figma",
];

function includesSection(resumeText: string, sectionName: string) {
  const pattern = new RegExp(
    `(^|\\n)\\s*${sectionName}s?\\s*:?\\s*(\\n|$)`,
    "i"
  );

  return pattern.test(resumeText);
}

function countMatches(resumeText: string, values: string[]) {
  return values.filter((value) => {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(`\\b${escapedValue}\\b`, "i").test(resumeText);
  }).length;
}

function countProjects(resumeText: string) {
  const techStackMatches = resumeText.match(/Tech Stack\s*:/gi) ?? [];

  return techStackMatches.length;
}

function hasImpactMetrics(resumeText: string) {
  return /(\d+(\.\d+)?\s*%|\b\d+\+?\s*(users?|customers?|clients?|requests?|transactions?|downloads?|ms|seconds?|minutes?|hours?|days?)\b|performance|optimized|improved|reduced|increased|decreased|scaled|latency|throughput)/i.test(
    resumeText
  );
}

function hasInternshipOrJobExperience(resumeText: string) {
  return /\b(internship|intern|software engineer|developer|engineer|consultant|analyst|associate|full[-\s]?time|part[-\s]?time|freelance|work experience|professional experience)\b/i.test(
    resumeText
  );
}

export function calculateAtsScore(resumeText: string): AtsScoreResult {
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(resumeText);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(resumeText);
  const hasProfile =
  /linkedin|github/i.test(resumeText);
  const hasSkillsSection =
  includesSection(resumeText, "skills") ||
  includesSection(resumeText, "technical skills");
  const hasProjectsSection = includesSection(resumeText, "projects");
  const hasExperienceSection = includesSection(resumeText, "experience");
  const hasEducationSection = includesSection(resumeText, "education");
  const technicalSkillCount = countMatches(resumeText, TECHNICAL_SKILLS);
  const keywordCount = countMatches(resumeText, ATS_KEYWORDS);

  const breakdown: AtsScoreBreakdown = {
    contact: (hasEmail ? 4 : 0) + (hasPhone ? 3 : 0) + (hasProfile ? 3 : 0),
    skills: (hasSkillsSection ? 10 : 0) + (technicalSkillCount >= 5 ? 10 : 0),
    projects:
      (hasProjectsSection ? 10 : 0) +
      (countProjects(resumeText) >= 2 ? 5 : 0) +
      (hasImpactMetrics(resumeText) ? 10 : 0),
    experience:
      (hasExperienceSection ? 10 : 0) +
      (hasInternshipOrJobExperience(resumeText) ? 10 : 0) +
      (countProjects(resumeText) >= 2 ? 5 : 0),
    education: hasEducationSection ? 10 : 0,
    keywords: Math.min(15, keywordCount),
  };
  const atsScore = Object.values(breakdown).reduce(
    (score, value) => score + value,
    0
  );
  
  return {
    atsScore,
    breakdown,
  };
}
