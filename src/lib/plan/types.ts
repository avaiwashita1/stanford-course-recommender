import type { Meeting, Term } from "@/lib/catalog/types";

/** A row of the student's plan, joined with catalog data for its chosen section. */
export interface PlannedEntry {
  courseId: string;
  title: string;
  term: Term;
  classId: number | null;
  /** Meetings of the chosen section (empty if the time is TBA or no section chosen). */
  meetings: Meeting[];
  unitsMin: number;
  unitsMax: number;
  /** e.g. "LEC 01" */
  sectionLabel: string | null;
}

/** Everything about the student that affects what they can take. */
export interface StudentContext {
  /** Courses completed or in progress (from My courses). */
  completed: ReadonlySet<string>;
  planned: PlannedEntry[];
}
