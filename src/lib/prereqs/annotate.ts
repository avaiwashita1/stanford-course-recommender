// Combines catalog courses, prerequisite rules and a student's completed courses
// into a per-course eligibility verdict. Pure function, so it's easy to test.
import type { Course } from "@/lib/catalog/types";
import { checkEligibility, explainEligibility, type Eligibility } from "./evaluate";
import type { StoredPrereqRule } from "./schema";

export interface AnnotatedCourse {
  course: Course;
  alreadyTaken: boolean;
  eligibility: Eligibility;
  explanation: string;
  recommended: string[];
}

export function annotateCourses(
  courses: Course[],
  rules: ReadonlyMap<string, StoredPrereqRule>,
  completed: ReadonlySet<string>,
): AnnotatedCourse[] {
  return courses.map((course) => {
    const alreadyTaken = completed.has(course.id) || course.crossListings.some((id) => completed.has(id));
    const stored = rules.get(course.id) ?? null;
    const result = checkEligibility(course, stored, completed);
    return {
      course,
      alreadyTaken,
      eligibility: result.status,
      explanation: explainEligibility(result),
      recommended: stored?.rule.recommended ?? [],
    };
  });
}

/** Courses a student can sign up for: not taken, and no definitely-missing prerequisites. */
export function canTake(a: AnnotatedCourse): boolean {
  return !a.alreadyTaken && a.eligibility !== "missing";
}
