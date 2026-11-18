// Shared catalog types. These mirror one row of the `courses` table.

export type Term = "Autumn" | "Winter" | "Spring" | "Summer";
export const TERMS: Term[] = ["Autumn", "Winter", "Spring", "Summer"];

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface Meeting {
  days: Day[]; // empty = days not announced yet
  start: string | null; // "13:30" (24h), null = TBA
  end: string | null;
  location: string | null;
}

export interface Section {
  classId: number;
  term: Term;
  sectionNumber: string;
  component: string; // LEC, SEM, DIS, LAB, ...
  /** The section that carries the units (e.g. the lecture). Discussions/labs are not primary. */
  primary: boolean;
  instructors: string[];
  meetings: Meeting[];
  notes: string | null;
}

export interface Course {
  id: string; // "CS 107"
  year: string; // "2026-2027"
  subject: string; // "CS"
  code: string; // "107"
  title: string;
  description: string;
  unitsMin: number;
  unitsMax: number;
  gers: string[];
  grading: string;
  repeatable: boolean;
  courseId: number; // ExploreCourses id (shared by cross-listed courses)
  /** Other codes for the same class, e.g. CS 229 <-> STATS 229. Filled in by the sync script. */
  crossListings: string[];
  prereqText: string | null; // raw "Prerequisite: ..." text from the description
  terms: Term[]; // terms with at least one section this year
  /** True when the only sections are independent study / thesis (INS, T/D). */
  independentStudy: boolean;
  sections: Section[];
}
