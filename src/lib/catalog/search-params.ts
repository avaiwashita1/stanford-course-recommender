// Turns the URL query (?q=...&term=Winter&days=Tue&days=Thu&min=3&max=4) into typed filters.
import { DAYS, TERMS, type Day, type Term } from "./types";
import type { CourseFilters } from "./filters";

export interface CourseSearch extends CourseFilters {
  q: string;
}

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

function num(v: string | string[] | undefined): number | undefined {
  const s = list(v)[0];
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function parseCourseSearch(params: Params): CourseSearch {
  return {
    q: (list(params.q)[0] ?? "").trim().slice(0, 200),
    terms: list(params.term).filter((t): t is Term => (TERMS as string[]).includes(t)),
    days: list(params.days).filter((d): d is Day => (DAYS as string[]).includes(d)),
    minUnits: num(params.min),
    maxUnits: num(params.max),
  };
}

export function hasAnyCriteria(s: CourseSearch): boolean {
  return Boolean(s.q || s.terms?.length || s.days?.length || s.minUnits !== undefined || s.maxUnits !== undefined);
}
