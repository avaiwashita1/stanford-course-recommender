// Loads prerequisite rules for a set of courses (Supabase, or data/prereq-rules.json locally).
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import type { PrereqRule, StoredPrereqRule } from "./schema";

let local: Promise<Map<string, StoredPrereqRule>> | null = null;
function loadLocal() {
  local ??= readFile(join(process.cwd(), "data/prereq-rules.json"), "utf8")
    .then((t) => new Map((JSON.parse(t) as StoredPrereqRule[]).map((r) => [r.courseId, r])))
    .catch(() => new Map());
  return local;
}

export async function getPrereqRules(courseIds: string[]): Promise<Map<string, StoredPrereqRule>> {
  if (courseIds.length === 0) return new Map();
  if (process.env.CATALOG_SOURCE === "local") {
    const all = await loadLocal();
    return new Map(courseIds.flatMap((id) => (all.has(id) ? [[id, all.get(id)!] as const] : [])));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prereq_rules")
    .select("course_id, source_text, rule")
    .in("course_id", courseIds);
  if (error) throw new Error(`Couldn't load prerequisite rules: ${error.message}`);
  return new Map(
    (data ?? []).map((r) => [
      r.course_id as string,
      { courseId: r.course_id, sourceText: r.source_text, rule: r.rule as PrereqRule },
    ]),
  );
}
