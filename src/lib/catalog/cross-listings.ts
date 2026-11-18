// Cross-listed courses (e.g. CS 229 and STATS 229) are one class with several codes.
// ExploreCourses gives them the same courseId.
import type { Course } from "./types";

/** Fills in `crossListings` for every course, based on a shared courseId. */
export function linkCrossListings(courses: Course[]): Course[] {
  const groups = new Map<number, string[]>();
  for (const c of courses) {
    if (!c.courseId) continue;
    groups.set(c.courseId, [...(groups.get(c.courseId) ?? []), c.id]);
  }
  return courses.map((c) => ({
    ...c,
    crossListings: c.courseId ? (groups.get(c.courseId) ?? []).filter((id) => id !== c.id) : [],
  }));
}

/** Keeps only the first listing of each class (input should already be ranked). */
export function dedupeCrossListings(courses: Course[]): Course[] {
  const seen = new Set<string>();
  return courses.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    c.crossListings.forEach((id) => seen.add(id));
    return true;
  });
}
