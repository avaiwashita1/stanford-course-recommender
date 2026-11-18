// Simple in-memory text search, used when CATALOG_SOURCE=local (offline development)
// and in tests. In production, Postgres full-text search does this job.
import { normalizeCourseCode } from "./code";
import type { Course } from "./types";

const tokenize = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function scoreCourse(course: Course, query: string): number {
  const q = query.trim();
  if (!q) return 1;
  const code = normalizeCourseCode(q);
  if (code && course.id === code) return 1000;
  if (q.toUpperCase() === course.subject) return 500;

  const title = course.title.toLowerCase();
  const desc = course.description.toLowerCase();
  let score = 0;
  for (const t of tokenize(q)) {
    const inTitle = title.includes(t);
    const inDesc = desc.includes(t);
    if (!inTitle && !inDesc) return 0; // every word must appear somewhere
    score += (inTitle ? 10 : 0) + (inDesc ? 1 : 0);
  }
  return score;
}

export function searchLocal(courses: Course[], query: string): Course[] {
  return courses
    .map((c) => ({ c, s: scoreCourse(c, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.id.localeCompare(b.c.id, "en", { numeric: true }))
    .map((x) => x.c);
}
