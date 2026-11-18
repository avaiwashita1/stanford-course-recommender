// Validates a course list coming from the browser before it is saved.
// Never trust the client: re-normalize codes, cap sizes, and allow only known values.
import { normalizeCourseCode } from "@/lib/catalog/code";
import { COUNTED_STATUSES, type TranscriptCourse } from "./parse";

const TERM_RE = /^\d{4}-\d{4} (Autumn|Winter|Spring|Summer)$/;
export const MAX_COURSES = 200;

export interface CourseRowInput {
  course_id: string;
  title: string;
  term: string | null;
  status: "completed" | "in_progress";
  source: "transcript" | "manual";
}

export function toSavableRows(input: unknown): CourseRowInput[] {
  if (!Array.isArray(input)) throw new Error("Expected a list of courses.");
  if (input.length > MAX_COURSES) throw new Error(`At most ${MAX_COURSES} courses can be saved.`);

  const rows = new Map<string, CourseRowInput>();
  for (const raw of input as Partial<TranscriptCourse>[]) {
    const id = normalizeCourseCode(String(raw?.courseId ?? ""));
    if (!id) continue;
    if (!COUNTED_STATUSES.includes(raw.status as never)) continue; // withdrawn etc. aren't saved
    rows.set(id, {
      course_id: id,
      title: String(raw.title ?? "").slice(0, 200),
      term: typeof raw.term === "string" && TERM_RE.test(raw.term) ? raw.term : null,
      status: raw.status as CourseRowInput["status"],
      source: raw.source === "transcript" ? "transcript" : "manual",
    });
  }
  return [...rows.values()];
}
