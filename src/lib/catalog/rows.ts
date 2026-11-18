// Converts between Course objects (camelCase) and `courses` table rows (snake_case).
import { codeNumber } from "./code";
import type { Course, Section, Term } from "./types";

export interface CourseRow {
  id: string;
  year: string;
  subject: string;
  code: string;
  code_num: number;
  title: string;
  description: string;
  units_min: number;
  units_max: number;
  gers: string[];
  grading: string;
  repeatable: boolean;
  course_id: number;
  cross_listings: string[];
  prereq_text: string | null;
  terms: string[];
  independent_study: boolean;
  sections: Section[];
}

export function courseToRow(c: Course): CourseRow {
  return {
    id: c.id,
    year: c.year,
    subject: c.subject,
    code: c.code,
    code_num: codeNumber(c.code),
    title: c.title,
    description: c.description,
    units_min: c.unitsMin,
    units_max: c.unitsMax,
    gers: c.gers,
    grading: c.grading,
    repeatable: c.repeatable,
    course_id: c.courseId,
    cross_listings: c.crossListings,
    prereq_text: c.prereqText,
    terms: c.terms,
    independent_study: c.independentStudy,
    sections: c.sections,
  };
}

export function rowToCourse(r: CourseRow): Course {
  return {
    id: r.id,
    year: r.year,
    subject: r.subject,
    code: r.code,
    title: r.title,
    description: r.description,
    unitsMin: Number(r.units_min),
    unitsMax: Number(r.units_max),
    gers: r.gers ?? [],
    grading: r.grading,
    repeatable: r.repeatable,
    courseId: r.course_id,
    crossListings: r.cross_listings ?? [],
    prereqText: r.prereq_text,
    terms: (r.terms ?? []) as Term[],
    independentStudy: r.independent_study,
    sections: r.sections ?? [],
  };
}
