// Reads and writes the signed-in student's course list (RLS limits it to their own rows).
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TranscriptCourse } from "./parse";
import type { CourseRowInput } from "./validate";

export async function getMyCourses(): Promise<TranscriptCourse[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return [];

  const { data, error } = await supabase
    .from("completed_courses")
    .select("course_id, title, term, status, source")
    .order("term", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`Couldn't load your courses: ${error.message}`);

  return (data ?? []).map((r) => ({
    courseId: r.course_id,
    title: r.title,
    term: r.term,
    status: r.status,
    source: r.source,
  }));
}

export async function replaceMyCourses(rows: CourseRowInput[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_completed_courses", { items: rows });
  if (error) throw new Error(error.message);
}
