// Reads/writes the signed-in student's plan and builds their full context
// (completed courses + plan with section meetings). RLS limits rows to the student.
import "server-only";
import { getCoursesByIds } from "@/lib/catalog/repository";
import type { Course, Term } from "@/lib/catalog/types";
import { createClient } from "@/lib/supabase/server";
import { COUNTED_STATUSES } from "@/lib/transcript/parse";
import { getMyCourses } from "@/lib/transcript/repository";
import type { PlannedEntry, StudentContext } from "./types";

interface PlanRow {
  course_id: string;
  term: Term;
  class_id: number | null;
  title: string;
}

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

export function toPlannedEntry(row: PlanRow, course: Course | undefined): PlannedEntry {
  const section = course?.sections.find((s) => s.classId === row.class_id && s.term === row.term);
  return {
    courseId: row.course_id,
    title: course?.title ?? row.title,
    term: row.term,
    classId: row.class_id,
    meetings: section?.meetings ?? [],
    unitsMin: course?.unitsMin ?? 0,
    unitsMax: course?.unitsMax ?? 0,
    sectionLabel: section ? `${section.component} ${section.sectionNumber}` : null,
  };
}

export async function getMyPlan(): Promise<PlannedEntry[]> {
  const supabase = await signedIn();
  if (!supabase) return [];
  const { data, error } = await supabase.from("planned_courses").select("course_id, term, class_id, title");
  if (error) throw new Error(`Couldn't load your plan: ${error.message}`);
  const rows = (data ?? []) as PlanRow[];
  const courses = await getCoursesByIds(rows.map((r) => r.course_id));
  return rows.map((r) => toPlannedEntry(r, courses.get(r.course_id)));
}

export async function getStudentContext(): Promise<StudentContext> {
  const [myCourses, planned] = await Promise.all([getMyCourses(), getMyPlan()]);
  const completed = new Set(myCourses.filter((c) => COUNTED_STATUSES.includes(c.status)).map((c) => c.courseId));
  return { completed, planned };
}

export async function upsertPlanned(row: PlanRow): Promise<void> {
  const supabase = await signedIn();
  if (!supabase) throw new Error("Not signed in");
  const { error } = await supabase.from("planned_courses").upsert(row);
  if (error) throw new Error(error.message);
}

export async function deletePlanned(courseId: string): Promise<void> {
  const supabase = await signedIn();
  if (!supabase) throw new Error("Not signed in");
  const { error } = await supabase.from("planned_courses").delete().eq("course_id", courseId);
  if (error) throw new Error(error.message);
}

/** Daily recommendation limit. Returns false if the student has used up today's requests. */
export async function tryUseRecommendation(limit: number): Promise<boolean> {
  const supabase = await signedIn();
  if (!supabase) return false;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("recommendation_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  if ((count ?? 0) >= limit) return false;
  const insert = await supabase.from("recommendation_requests").insert({});
  if (insert.error) throw new Error(insert.error.message);
  return true;
}
