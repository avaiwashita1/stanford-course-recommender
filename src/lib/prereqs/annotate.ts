// Combines catalog courses, prerequisite rules and the student's record + plan into a
// per-course verdict: which quarters they could take it in, and why. Pure functions.
import { sectionFitsDays } from "@/lib/catalog/filters";
import { formatMeeting } from "@/lib/catalog/format";
import { TERMS, type Course, type Day, type Term } from "@/lib/catalog/types";
import { conflictingCourses, termsBefore } from "@/lib/plan/conflicts";
import type { PlannedEntry, StudentContext } from "@/lib/plan/types";
import { checkEligibility, explainEligibility, type Eligibility, type EligibilityResult } from "./evaluate";
import type { StoredPrereqRule } from "./schema";

/** One choosable lecture/seminar section, for the "Add to plan" menu. */
export interface SectionOption {
  classId: number | null; // null = no section listed / time TBA
  label: string; // "LEC 01"
  schedule: string; // "Mon Wed Fri 10:30am–11:20am" or "Time TBA"
  conflictsWith: string[]; // planned courses it overlaps
  fitsDays: boolean;
}

export interface TermOption {
  term: Term;
  eligibility: Eligibility;
  sections: SectionOption[];
}

export interface AnnotatedCourse {
  course: Course;
  alreadyTaken: boolean;
  /** The quarter this course is already in the student's plan, if any. */
  plannedTerm: Term | null;
  /** Best eligibility across the quarters considered. */
  eligibility: Eligibility;
  explanation: string;
  recommended: string[];
  /** Quarters where the student is eligible (or unverified) AND some lecture section fits. */
  viableTerms: Term[];
  /** Quarters where every lecture section clashes with the plan. */
  conflictTerms: Term[];
  /** Per-quarter section choices for adding the course to the plan. */
  options: TermOption[];
}

export interface AnnotateOptions {
  /** Only consider these quarters (default: all the course is offered in). */
  terms?: Term[];
  /** Only sections meeting exclusively on these days count. */
  days?: Day[];
}

const RANK: Record<Eligibility, number> = { eligible: 3, no_prereqs: 3, unverified: 2, missing: 1 };

/** Completed courses plus courses planned in quarters before `term`. */
export function completedBy(term: Term, ctx: StudentContext): Set<string> {
  const before = new Set(termsBefore(term));
  return new Set([...ctx.completed, ...ctx.planned.filter((p) => before.has(p.term)).map((p) => p.courseId)]);
}

function labelPlanned(result: EligibilityResult, planned: PlannedEntry[], completed: ReadonlySet<string>): EligibilityResult {
  return {
    ...result,
    groups: result.groups.map((g) => {
      if (!g.metBy || completed.has(g.metBy)) return g;
      const p = planned.find((x) => x.courseId === g.metBy);
      return p ? { ...g, metBy: `${g.metBy} (planned ${p.term})` } : g;
    }),
  };
}

export function annotateCourses(
  courses: Course[],
  rules: ReadonlyMap<string, StoredPrereqRule>,
  ctx: StudentContext,
  options: AnnotateOptions = {},
): AnnotatedCourse[] {
  return courses.map((course) => {
    const isTaken = (id: string) => ctx.completed.has(id);
    const alreadyTaken = isTaken(course.id) || course.crossListings.some(isTaken);
    const plannedEntry = ctx.planned.find((p) => p.courseId === course.id || course.crossListings.includes(p.courseId));
    const stored = rules.get(course.id) ?? null;

    const terms = TERMS.filter((t) => course.terms.includes(t) && (!options.terms?.length || options.terms.includes(t)));
    const perTerm = (terms.length ? terms : course.terms).map((term) => {
      const result = checkEligibility(course, stored, completedBy(term, ctx));
      const sections = course.sections.filter((s) => s.primary && s.term === term);
      const dayOk = sections.filter((s) => !options.days?.length || sectionFitsDays(s, options.days));
      const free = dayOk.filter((s) => conflictingCourses(s, ctx.planned, plannedEntry?.courseId).length === 0);
      // Courses with no listed lecture section in a term (rare) are judged on eligibility alone.
      const fits = sections.length === 0 ? !options.days?.length : free.length > 0;
      const allClash = dayOk.length > 0 && free.length === 0;
      const sectionOptions: SectionOption[] = sections.length
        ? sections.map((s) => ({
            classId: s.classId,
            label: `${s.component} ${s.sectionNumber}`,
            schedule: s.meetings.length ? s.meetings.map(formatMeeting).join(", ") : "Time TBA",
            conflictsWith: conflictingCourses(s, ctx.planned, plannedEntry?.courseId),
            fitsDays: !options.days?.length || sectionFitsDays(s, options.days),
          }))
        : [{ classId: null, label: "", schedule: "Time TBA", conflictsWith: [], fitsDays: !options.days?.length }];
      return { term, result, fits, allClash, sectionOptions };
    });

    const best = [...perTerm].sort((a, b) => RANK[b.result.status] - RANK[a.result.status])[0];
    const result = best ? labelPlanned(best.result, ctx.planned, ctx.completed) : checkEligibility(course, stored, ctx.completed);

    return {
      course,
      alreadyTaken,
      plannedTerm: plannedEntry?.term ?? null,
      eligibility: result.status,
      explanation: explainEligibility(result),
      recommended: stored?.rule.recommended ?? [],
      viableTerms: perTerm.filter((t) => t.fits && t.result.status !== "missing").map((t) => t.term),
      conflictTerms: perTerm.filter((t) => t.allClash).map((t) => t.term),
      options: perTerm.map((t) => ({ term: t.term, eligibility: t.result.status, sections: t.sectionOptions })),
    };
  });
}

/** Courses a student could add: not taken, not already planned, and viable in some quarter. */
export function canTake(a: AnnotatedCourse): boolean {
  return !a.alreadyTaken && !a.plannedTerm && a.viableTerms.length > 0;
}
