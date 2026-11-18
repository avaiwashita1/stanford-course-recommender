// Deterministic course filters (units, days, terms). Pure functions so they're easy to test.
import type { Course, Day, Section, Term } from "./types";

export interface CourseFilters {
  terms?: Term[]; // offered in at least one of these terms
  minUnits?: number;
  maxUnits?: number;
  /** Only courses with a lecture/seminar that meets exclusively on these days. */
  days?: Day[];
  includeIndependentStudy?: boolean;
}

/** True if the course can be taken for some unit count inside [min, max]. */
export function matchesUnits(course: Course, min?: number, max?: number): boolean {
  if (min !== undefined && course.unitsMax < min) return false;
  if (max !== undefined && course.unitsMin > max) return false;
  return true;
}

export function matchesTerms(course: Course, terms?: Term[]): boolean {
  if (!terms?.length) return true;
  return course.terms.some((t) => terms.includes(t));
}

/** A section "fits" if it has announced meeting days and every one is in `allowed`. */
export function sectionFitsDays(section: Section, allowed: Day[]): boolean {
  const meetings = section.meetings.filter((m) => m.days.length > 0);
  if (!meetings.length) return false; // days TBA: can't promise it fits
  return meetings.every((m) => m.days.every((d) => allowed.includes(d)));
}

/**
 * True if, in some allowed term, there is a primary section (lecture/seminar)
 * that only meets on the allowed days. Discussion/lab sections are handled by
 * the planner later, since students usually pick among several options.
 */
export function matchesDays(course: Course, days?: Day[], terms?: Term[]): boolean {
  if (!days?.length) return true;
  return course.sections.some(
    (s) => s.primary && (!terms?.length || terms.includes(s.term)) && sectionFitsDays(s, days),
  );
}

export function matchesFilters(course: Course, f: CourseFilters): boolean {
  if (!f.includeIndependentStudy && course.independentStudy) return false;
  return (
    matchesTerms(course, f.terms) &&
    matchesUnits(course, f.minUnits, f.maxUnits) &&
    matchesDays(course, f.days, f.terms)
  );
}
