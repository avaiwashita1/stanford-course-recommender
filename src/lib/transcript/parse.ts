// Parses the text lines of a Stanford unofficial transcript into course records.
// Only course codes, titles, quarters and a status are kept: no grades, names or IDs.
import { normalizeCourseCode } from "@/lib/catalog/code";

export type CourseStatus =
  | "completed" // passed with a grade or S/CR
  | "in_progress" // on the transcript without a grade yet (current quarter)
  | "withdrawn" // W
  | "not_passed"; // F, NP, NC, I, etc.

export interface TranscriptCourse {
  courseId: string; // "CS 106B"
  title: string;
  term: string | null; // "2023-2024 Winter"
  status: CourseStatus;
  source: "transcript" | "manual";
}

/** Statuses that count toward prerequisites. */
export const COUNTED_STATUSES: CourseStatus[] = ["completed", "in_progress"];

const TERM_RE = /^(\d{4}-\d{4}) (Autumn|Winter|Spring|Summer)\b/;
// SUBJECT CODE [COMPONENT] TITLE ATTEMPTED EARNED [GRADE] [DATE]
const COURSE_RE =
  /^([A-Z][A-Z&]{1,9})\s+(\d{1,4}[A-Z]{0,4})\s+(?:([A-Z/]{2,4})\s+)?(.*?)\s*(\d+\.\d{2})\s+(\d+\.\d{2})(?:\s+([A-Z][A-Z+-]{0,3}|\*))?(?:\s+\d{2}\/\d{2}\/\d{4})?$/;

const WITHDRAWN = new Set(["W"]);
const NOT_PASSED = new Set(["F", "NP", "NC", "I", "N", "GNR", "NS", "*"]);
const COMPONENTS = new Set(["LEC", "SEM", "DIS", "LAB", "LBS", "COL", "ISF", "ISS", "PRA", "SCS", "LNG", "ACT", "TUT", "INS", "T/D", "WKS", "RES", "IDS", "CAS", "PRC", "CLK", "API"]);

function statusFor(grade: string | undefined): CourseStatus {
  if (!grade) return "in_progress";
  if (WITHDRAWN.has(grade)) return "withdrawn";
  if (NOT_PASSED.has(grade)) return "not_passed";
  return "completed";
}

const RANK: Record<CourseStatus, number> = { completed: 3, in_progress: 2, not_passed: 1, withdrawn: 0 };

export function parseTranscriptLines(lines: string[]): TranscriptCourse[] {
  const byCourse = new Map<string, TranscriptCourse>();
  let term: string | null = null;
  let last: { record: TranscriptCourse; rawTitle: string } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    const t = TERM_RE.exec(line);
    if (t) {
      term = `${t[1]} ${t[2]}`;
      last = null;
      continue;
    }
    const m = COURSE_RE.exec(line);
    if (!m) {
      // Long titles wrap onto following ALL-CAPS lines; instructor names are mixed case.
      if (last && isTitleContinuation(line)) {
        last.rawTitle += ` ${line}`;
        last.record.title = titleCase(last.rawTitle);
      } else {
        last = null;
      }
      continue;
    }

    const courseId = normalizeCourseCode(`${m[1]} ${m[2]}`);
    if (!courseId) continue;
    // If the "component" isn't a known one, it was actually the first word of the title.
    const title = (m[3] && !COMPONENTS.has(m[3]) ? `${m[3]} ${m[4]}` : m[4]).trim();

    const record: TranscriptCourse = {
      courseId,
      title: titleCase(title),
      term,
      status: statusFor(m[7]),
      source: "transcript",
    };

    // A course can appear more than once (e.g. withdrawn, then retaken). Keep the best
    // outcome; for equal outcomes keep the later attempt.
    const existing = byCourse.get(courseId);
    if (!existing || RANK[record.status] >= RANK[existing.status]) byCourse.set(courseId, record);
    last = { record, rawTitle: title };
  }
  return [...byCourse.values()];
}

function isTitleContinuation(line: string): boolean {
  return (
    /[A-Z]/.test(line) &&
    line === line.toUpperCase() &&
    !COMPONENTS.has(line) &&
    !/^(UG|GR|COURSE CMPT|PAGE)\b/i.test(line) &&
    !/\d+\.\d{2}/.test(line)
  );
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
    .replace(/\b(And|Of|The|In|For|To|A|An|On|With)\b/g, (w, _p, i) => (i === 0 ? w : w.toLowerCase()));
}
