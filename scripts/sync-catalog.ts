/**
 * Downloads the current academic year's catalog from ExploreCourses and
 * (optionally) uploads it to Supabase.
 *
 *   npm run sync-catalog                    # all departments -> data/catalog.json
 *   npm run sync-catalog -- --dept CS,MATH  # only some departments
 *   npm run sync-catalog -- --upload        # also upsert into Supabase (needs SUPABASE_SECRET_KEY)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { linkCrossListings } from "../src/lib/catalog/cross-listings";
import { parseCoursesXml } from "../src/lib/catalog/parse-xml";
import { courseToRow } from "../src/lib/catalog/rows";
import type { Course } from "../src/lib/catalog/types";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local; rely on real environment variables
}

const BASE = "https://explorecourses.stanford.edu";
const VIEW = "xml-20200810";
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const OUT = option("out") ?? "data/catalog.json";

async function fetchText(url: string, attempts = 3): Promise<string> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "course-recommender-sync" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

async function listDepartments(): Promise<string[]> {
  const xml = await fetchText(`${BASE}/?view=${VIEW}`);
  const doc = new XMLParser({ ignoreAttributes: false, isArray: () => true }).parse(xml);
  const names: string[] = [];
  for (const schools of doc.schools ?? [])
    for (const school of schools.school ?? [])
      for (const dept of school.department ?? []) names.push(dept["@_name"]);
  return [...new Set(names)].sort();
}

function departmentUrl(dept: string): string {
  // page=0 returns every course in the department. The term filters limit results to
  // courses with sections this academic year.
  const params = new URLSearchParams({
    view: VIEW,
    "filter-coursestatus-Active": "on",
    page: "0",
    q: dept,
    [`filter-departmentcode-${dept}`]: "on",
    "filter-term-Autumn": "on",
    "filter-term-Winter": "on",
    "filter-term-Spring": "on",
    "filter-term-Summer": "on",
  });
  return `${BASE}/search?${params}`;
}

async function syncDepartments(depts: string[]): Promise<Course[]> {
  const byId = new Map<string, Course>();
  const failed: string[] = [];
  let done = 0;
  const queue = [...depts];

  async function worker() {
    for (let dept = queue.shift(); dept; dept = queue.shift()) {
      try {
        const courses = parseCoursesXml(await fetchText(departmentUrl(dept)));
        for (const c of courses) if (!byId.has(c.id)) byId.set(c.id, c);
        done++;
        if (done % 25 === 0 || done === depts.length)
          console.log(`${done}/${depts.length} departments, ${byId.size} courses`);
      } catch (err) {
        failed.push(dept);
        console.error(`\n${dept} failed: ${(err as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log();
  if (failed.length) console.warn(`Failed departments (re-run with --dept ${failed.join(",")}):`);
  return linkCrossListings([...byId.values()]).sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

async function upload(courses: Course[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Upload needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const rows = courses.map(courseToRow);
  const BATCH = 300;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from("courses")
      .upsert(rows.slice(i, i + BATCH).map((r) => ({ ...r, updated_at: new Date().toISOString() })));
    if (error) throw new Error(`Upload failed at row ${i}: ${error.message}`);
    process.stdout.write(`\rUploaded ${Math.min(i + BATCH, rows.length)}/${rows.length}   `);
  }
  console.log();

  // Remove courses from older academic years.
  const year = courses[0]?.year;
  if (year) {
    const { error } = await supabase.from("courses").delete().neq("year", year);
    if (error) throw new Error(`Cleanup failed: ${error.message}`);
  }
}

async function main() {
  const only = option("dept")?.split(",").map((d) => d.trim().toUpperCase());
  const depts = only ?? (await listDepartments());
  console.log(`Syncing ${depts.length} departments from ExploreCourses…`);
  const courses = await syncDepartments(depts);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(courses));
  console.log(`Wrote ${courses.length} courses to ${OUT}`);

  if (flag("upload")) await upload(courses);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
