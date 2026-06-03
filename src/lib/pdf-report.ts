import { jsPDF } from "jspdf";

type AtsBreakdown = {
  contact: number;
  skills: number;
  projects: number;
  experience: number;
  education: number;
  keywords: number;
};

type AtsAnalysis = {
  atsScore: number;
  breakdown: AtsBreakdown;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

type JobMatchAnalysis = {
  matchScore: number;
  matchedSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
};

type InterviewQuestionsAnalysis = {
  technicalQuestions: string[];
  projectQuestions: string[];
  behavioralQuestions: string[];
};

export type ResumeReportData = {
  analysis: AtsAnalysis;
  jobMatch: JobMatchAnalysis | null;
  interviewQuestions: InterviewQuestionsAnalysis | null;
};

const PAGE_MARGIN = 42;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const LINE_HEIGHT = 15;

function formatTimestamp() {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function addFooter(doc: jsPDF, pageNumber: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`ResumeAI Analysis Report - Page ${pageNumber}`, PAGE_MARGIN, 815);
}

function ensureSpace(doc: jsPDF, cursorY: number, neededHeight: number) {
  if (cursorY + neededHeight <= PAGE_HEIGHT - PAGE_MARGIN) {
    return cursorY;
  }

  doc.addPage();
  addFooter(doc, doc.getNumberOfPages());

  return PAGE_MARGIN;
}

function addSectionHeading(doc: jsPDF, title: string, cursorY: number) {
  const nextY = ensureSpace(doc, cursorY, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 33, 61);
  doc.text(title, PAGE_MARGIN, nextY);
  doc.setDrawColor(210, 220, 235);
  doc.line(PAGE_MARGIN, nextY + 7, PAGE_WIDTH - PAGE_MARGIN, nextY + 7);

  return nextY + 24;
}

function addParagraph(doc: jsPDF, text: string, cursorY: number) {
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
  const nextY = ensureSpace(doc, cursorY, lines.length * LINE_HEIGHT);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(68, 75, 87);
  doc.text(lines, PAGE_MARGIN, nextY);

  return nextY + lines.length * LINE_HEIGHT + 4;
}

function addBullets(doc: jsPDF, items: string[], cursorY: number) {
  if (items.length === 0) {
    return addParagraph(doc, "No items available.", cursorY);
  }

  let nextY = cursorY;

  for (const item of items) {
    const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 14) as string[];
    nextY = ensureSpace(doc, nextY, lines.length * LINE_HEIGHT + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(68, 75, 87);
    doc.text("•", PAGE_MARGIN, nextY);
    doc.text(lines, PAGE_MARGIN + 14, nextY);
    nextY += lines.length * LINE_HEIGHT + 4;
  }

  return nextY + 2;
}

function addKeyValueRows(
  doc: jsPDF,
  rows: Array<[string, string]>,
  cursorY: number
) {
  let nextY = cursorY;

  for (const [label, value] of rows) {
    nextY = ensureSpace(doc, nextY, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(45, 55, 72);
    doc.text(label, PAGE_MARGIN, nextY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(68, 75, 87);
    doc.text(value, PAGE_MARGIN + 160, nextY);

    nextY += 18;
  }

  return nextY + 4;
}

function addListSection(
  doc: jsPDF,
  title: string,
  items: string[],
  cursorY: number
) {
  let nextY = addSectionHeading(doc, title, cursorY);

  nextY = addBullets(doc, items, nextY);

  return nextY;
}

export function generateResumeReportPdf(data: ResumeReportData) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  addFooter(doc, 1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 33, 61);
  doc.text("ResumeAI Analysis Report", PAGE_MARGIN, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 99, 115);
  doc.text(`Generated ${formatTimestamp()}`, PAGE_MARGIN, 75);

  let cursorY = 110;

  cursorY = addSectionHeading(doc, "ATS Score", cursorY);
  cursorY = addKeyValueRows(
    doc,
    [["Overall ATS Score", `${data.analysis.atsScore} / 100`]],
    cursorY
  );

  cursorY = addSectionHeading(doc, "ATS Breakdown", cursorY);
  cursorY = addKeyValueRows(
    doc,
    [
      ["Contact", `${data.analysis.breakdown.contact} / 10`],
      ["Skills", `${data.analysis.breakdown.skills} / 20`],
      ["Projects", `${data.analysis.breakdown.projects} / 25`],
      ["Experience", `${data.analysis.breakdown.experience} / 25`],
      ["Education", `${data.analysis.breakdown.education} / 10`],
      ["Keywords", `${data.analysis.breakdown.keywords} / 15`],
    ],
    cursorY
  );

  cursorY = addListSection(doc, "Skills", data.analysis.skills, cursorY);
  cursorY = addListSection(doc, "Strengths", data.analysis.strengths, cursorY);
  cursorY = addListSection(doc, "Weaknesses", data.analysis.weaknesses, cursorY);
  cursorY = addListSection(
    doc,
    "Suggestions",
    data.analysis.suggestions,
    cursorY
  );

  if (data.jobMatch) {
    cursorY = addSectionHeading(doc, "Job Match", cursorY);
    cursorY = addKeyValueRows(
      doc,
      [["Match Score", `${data.jobMatch.matchScore} / 100`]],
      cursorY
    );
    cursorY = addListSection(
      doc,
      "Matched Skills",
      data.jobMatch.matchedSkills,
      cursorY
    );
    cursorY = addListSection(
      doc,
      "Missing Keywords",
      data.jobMatch.missingKeywords,
      cursorY
    );
    cursorY = addListSection(
      doc,
      "Recommendations",
      data.jobMatch.recommendations,
      cursorY
    );
  }

  if (data.interviewQuestions) {
    cursorY = addSectionHeading(doc, "Interview Questions", cursorY);
    cursorY = addListSection(
      doc,
      "Technical Questions",
      data.interviewQuestions.technicalQuestions,
      cursorY
    );
    cursorY = addListSection(
      doc,
      "Project Questions",
      data.interviewQuestions.projectQuestions,
      cursorY
    );
    addListSection(
      doc,
      "Behavioral Questions",
      data.interviewQuestions.behavioralQuestions,
      cursorY
    );
  }

  doc.save("resumeai-analysis-report.pdf");
}
