// Deterministic time-conflict checks.
import { toMinutes } from "@/lib/catalog/time";
import { TERMS, type Meeting, type Section, type Term } from "@/lib/catalog/types";
import type { PlannedEntry } from "./types";

/** Two meetings conflict if they share a day and their times overlap. Unknown times never conflict. */
export function meetingsOverlap(a: Meeting, b: Meeting): boolean {
  if (!a.start || !a.end || !b.start || !b.end) return false;
  if (!a.days.some((d) => b.days.includes(d))) return false;
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

/** Planned courses (in the section's term) whose chosen section overlaps this section. */
export function conflictingCourses(section: Section, planned: PlannedEntry[], ignoreCourseId?: string): string[] {
  return planned
    .filter((p) => p.term === section.term && p.courseId !== ignoreCourseId)
    .filter((p) => p.meetings.some((pm) => section.meetings.some((sm) => meetingsOverlap(pm, sm))))
    .map((p) => p.courseId);
}

/** Terms strictly before `term` in the academic year (Autumn < Winter < Spring < Summer). */
export function termsBefore(term: Term): Term[] {
  return TERMS.slice(0, TERMS.indexOf(term));
}

/** Pairs of planned courses that overlap, e.g. after the catalog changed. */
export function planConflicts(planned: PlannedEntry[]): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < planned.length; i++)
    for (let j = i + 1; j < planned.length; j++) {
      const a = planned[i], b = planned[j];
      if (a.term === b.term && a.meetings.some((m) => b.meetings.some((n) => meetingsOverlap(m, n))))
        out.push([a.courseId, b.courseId]);
    }
  return out;
}
