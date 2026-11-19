// Server-side checks before adding a course to the plan (never trust the browser).
import { TERMS, type Course, type Term } from "@/lib/catalog/types";
import { conflictingCourses } from "./conflicts";
import type { PlannedEntry } from "./types";

export type AddCheck = { ok: true } | { ok: false; message: string };

export function checkAddToPlan(course: Course | undefined, term: string, classId: number | null, planned: PlannedEntry[]): AddCheck {
  if (!course) return { ok: false, message: "That course isn't in this year's catalog." };
  if (!(TERMS as string[]).includes(term) || !course.terms.includes(term as Term)) {
    return { ok: false, message: `${course.id} isn't offered in ${term}.` };
  }
  const primary = course.sections.filter((s) => s.primary && s.term === term);
  if (classId === null) {
    if (primary.length > 0) return { ok: false, message: "Please choose a section." };
    return { ok: true };
  }
  const section = primary.find((s) => s.classId === classId);
  if (!section) return { ok: false, message: "That section doesn't exist." };
  const clashes = conflictingCourses(section, planned, course.id);
  if (clashes.length) return { ok: false, message: `That time conflicts with ${clashes.join(", ")}.` };
  return { ok: true };
}
