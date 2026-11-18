/**
 * One-time (re-runnable) AI pass: turns each course's prerequisite text into a structured rule.
 * Results are cached in prereqs/rules.json (committed), so re-runs only send changed text.
 *
 *   npm run parse-prereqs -- --limit 30          # try a few
 *   npm run parse-prereqs -- --subject CS        # one subject
 *   npm run parse-prereqs                        # everything that changed
 *   npm run parse-prereqs -- --reparse placement # re-parse cached courses matching a regex
 *   npm run parse-prereqs -- --upload            # also write rules to Supabase
 *
 * Needs data/catalog.json (npm run sync-catalog) and HOPSCOTCH_API_KEY.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createClaudeClient, MODELS } from "../src/lib/ai/client";
import type { Course } from "../src/lib/catalog/types";
import { normalizeRule } from "../src/lib/prereqs/normalize";
import { PREREQ_SYSTEM_PROMPT } from "../src/lib/prereqs/prompt";
import { AiPrereqRuleSchema, type CachedAiRule, type StoredPrereqRule } from "../src/lib/prereqs/schema";

try {
  process.loadEnvFile(".env.local");
} catch {}

const RULES_FILE = "prereqs/rules.json";
const BATCH = 12;
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const option = (n: string) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const limit = option("limit") ? Number(option("limit")) : Infinity;
const subject = option("subject")?.toUpperCase();
// Re-parse cached courses whose text matches this regex (e.g. after improving the prompt).
const reparse = option("reparse") ? new RegExp(option("reparse")!, "i") : null;

const BatchSchema = z.object({
  results: z.array(AiPrereqRuleSchema.extend({ courseId: z.string() })),
});

const client = createClaudeClient();
let inputTokens = 0;
let outputTokens = 0;

async function parseBatch(courses: Course[]): Promise<Map<string, z.infer<typeof AiPrereqRuleSchema>>> {
  const payload = courses.map((c) => ({ courseId: c.id, title: c.title, prerequisiteText: c.prereqText }));
  const response = await client.messages.parse({
    model: MODELS.prereqParser,
    max_tokens: 16000,
    system: PREREQ_SYSTEM_PROMPT,
    output_config: { effort: "medium", format: zodOutputFormat(BatchSchema) },
    messages: [
      {
        role: "user",
        content: `Convert the prerequisites for each of these ${courses.length} courses. Return one result per courseId.\n\n${JSON.stringify(payload, null, 1)}`,
      },
    ],
  });
  inputTokens += response.usage.input_tokens;
  outputTokens += response.usage.output_tokens;
  if (response.stop_reason !== "end_turn" || !response.parsed_output) {
    throw new Error(`Unexpected stop_reason ${response.stop_reason}`);
  }
  return new Map(response.parsed_output.results.map(({ courseId, ...rule }) => [courseId, rule]));
}

async function main() {
  const catalog: Course[] = JSON.parse(readFileSync("data/catalog.json", "utf8"));
  const index = { ids: new Set(catalog.map((c) => c.id)), crossListings: new Map(catalog.map((c) => [c.id, c.crossListings])) };
  const cache = new Map<string, CachedAiRule>(
    existsSync(RULES_FILE)
      ? (JSON.parse(readFileSync(RULES_FILE, "utf8")) as CachedAiRule[]).map((r) => [r.courseId, r])
      : [],
  );

  const todo = catalog
    .filter((c) => c.prereqText && !c.independentStudy)
    .filter((c) => !subject || c.subject === subject)
    .filter((c) => cache.get(c.id)?.sourceText !== c.prereqText || (reparse && reparse.test(c.prereqText!)))
    .slice(0, limit);
  console.log(`${todo.length} courses need parsing (${cache.size} cached).`);

  const batches: Course[][] = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

  let done = 0;
  const failed: string[] = [];
  const save = () =>
    writeFileSync(
      RULES_FILE,
      JSON.stringify([...cache.values()].sort((a, b) => a.courseId.localeCompare(b.courseId, "en", { numeric: true })), null, 1),
    );

  async function worker() {
    for (let batch = batches.shift(); batch; batch = batches.shift()) {
      try {
        const results = await parseBatch(batch);
        const unexpected = [...results.keys()].filter((id) => !batch.some((c) => c.id === id));
        if (unexpected.length) console.warn(`Model returned unknown courseIds: ${unexpected.join(", ")}`);
        for (const c of batch) {
          const rule = results.get(c.id);
          if (!rule) {
            failed.push(c.id);
            continue;
          }
          cache.set(c.id, { courseId: c.id, sourceText: c.prereqText!, ai: rule });
        }
      } catch (err) {
        console.error(`Batch failed (${batch.map((c) => c.id).join(", ")}): ${(err as Error).message}`);
        failed.push(...batch.map((c) => c.id));
      }
      done += batch.length;
      save();
      console.log(`${done}/${todo.length} parsed · tokens in ${inputTokens} out ${outputTokens}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  save();
  if (failed.length) console.warn(`${failed.length} failed; re-run to retry: ${failed.slice(0, 20).join(", ")}…`);

  // Clean-up is deterministic code, re-applied on every run (no AI cost).
  const rules: StoredPrereqRule[] = [...cache.values()].map((r) => ({
    courseId: r.courseId,
    sourceText: r.sourceText,
    rule: normalizeRule(r.ai, index),
  }));
  writeFileSync("data/prereq-rules.json", JSON.stringify(rules));
  if (args.includes("--upload")) await upload(rules);
}

async function upload(rules: StoredPrereqRule[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Upload needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  for (let i = 0; i < rules.length; i += 500) {
    const rows = rules.slice(i, i + 500).map((r) => ({
      course_id: r.courseId,
      source_text: r.sourceText,
      rule: r.rule,
      model: MODELS.prereqParser,
      parsed_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("prereq_rules").upsert(rows);
    if (error) throw new Error(`Upload failed: ${error.message}`);
  }
  console.log(`Uploaded ${rules.length} rules.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
