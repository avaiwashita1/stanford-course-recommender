// The one place the app reads the catalog from.
// - Default: Supabase (Postgres full-text search via the search_courses function).
// - CATALOG_SOURCE=local: reads data/catalog.json (from `npm run sync-catalog`), handy offline.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { dedupeCrossListings } from "./cross-listings";
import { matchesFilters } from "./filters";
import { searchLocal } from "./local-search";
import { rowToCourse, type CourseRow } from "./rows";
import type { CourseFilters } from "./filters";
import type { CourseSearch } from "./search-params";
import type { Course } from "./types";

export interface SearchResult {
  /** All matching courses, best first (the page decides how many to show). */
  courses: Course[];
  /** True when the database returned its maximum, so `total` may be an undercount. */
  capped: boolean;
}

const SQL_LIMIT = 500;

let localCatalog: Promise<Course[]> | null = null;
function loadLocalCatalog(): Promise<Course[]> {
  localCatalog ??= readFile(join(process.cwd(), "data/catalog.json"), "utf8").then(JSON.parse);
  return localCatalog;
}

async function candidatesFromSupabase(search: CourseSearch): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_courses", {
    q: search.q || null,
    p_terms: search.terms?.length ? search.terms : null,
    p_min: search.minUnits ?? null,
    p_max: search.maxUnits ?? null,
    p_limit: SQL_LIMIT,
  });
  if (error) throw new Error(`Catalog search failed: ${error.message}`);
  return (data as CourseRow[]).map(rowToCourse);
}

export async function searchCourses(search: CourseSearch): Promise<SearchResult> {
  const local = process.env.CATALOG_SOURCE === "local";
  const candidates = local
    ? searchLocal(await loadLocalCatalog(), search.q)
    : await candidatesFromSupabase(search);

  // Filters run in code (same logic for both sources). Units and terms are also
  // pre-filtered in SQL for speed; days can only be checked here.
  const matching = dedupeCrossListings(candidates.filter((c) => matchesFilters(c, search)));
  return { courses: matching, capped: !local && candidates.length >= SQL_LIMIT };
}

/**
 * Courses matching ANY of the phrases (and the filters), best text match first.
 * Used by recommendations. Cross-listings are collapsed.
 */
export async function searchCandidates(phrases: string[], filters: CourseFilters): Promise<Course[]> {
  let candidates: Course[];
  if (process.env.CATALOG_SOURCE === "local") {
    const all = await loadLocalCatalog();
    const seen = new Set<string>();
    candidates = phrases.flatMap((p) => searchLocal(all, p)).filter((c) => !seen.has(c.id) && seen.add(c.id));
  } else {
    // Postgres "websearch" syntax: "machine learning" or robotics or ...
    const q = phrases.map((p) => (p.includes(" ") ? `"${p.replace(/"/g, "")}"` : p)).join(" or ");
    candidates = await candidatesFromSupabase({ q, canTakeOnly: false, ...filters });
  }
  return dedupeCrossListings(candidates.filter((c) => matchesFilters(c, filters)));
}

/** Full catalog rows for specific course codes (e.g. the courses in a student's plan). */
export async function getCoursesByIds(ids: string[]): Promise<Map<string, Course>> {
  if (ids.length === 0) return new Map();
  if (process.env.CATALOG_SOURCE === "local") {
    const all = await loadLocalCatalog();
    return new Map(all.filter((c) => ids.includes(c.id)).map((c) => [c.id, c]));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").select("*").in("id", ids);
  if (error) throw new Error(`Couldn't load courses: ${error.message}`);
  return new Map((data as CourseRow[]).map((r) => [r.id, rowToCourse(r)]));
}
