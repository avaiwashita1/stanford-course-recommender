"use server";

import { searchCandidates } from "@/lib/catalog/repository";
import { parseCourseSearch } from "@/lib/catalog/search-params";
import { getPrereqRules } from "@/lib/prereqs/repository";
import { generateKeywords, rankCandidates } from "@/lib/recommend/ai";
import { recommend, type RecommendResult } from "@/lib/recommend/pipeline";
import { getStudentContext, tryUseRecommendation } from "@/lib/plan/repository";
import { createClient } from "@/lib/supabase/server";

/** What the student typed and picked, echoed back so the form keeps it after submitting. */
export interface RecommendFormValues {
  interests: string;
  terms: string[];
  days: string[];
  min: string;
  max: string;
}

export type RecommendState =
  | { status: "idle" }
  | { status: "error"; message: string; form: RecommendFormValues }
  | { status: "done"; result: RecommendResult; form: RecommendFormValues };

const MIN_CHARS = 10;
const MAX_CHARS = 1000;
const DAILY_LIMIT = Number(process.env.RECOMMEND_DAILY_LIMIT ?? 20);

export async function getRecommendations(_prev: RecommendState, formData: FormData): Promise<RecommendState> {
  const interests = String(formData.get("interests") ?? "").trim();
  const form: RecommendFormValues = {
    interests,
    terms: formData.getAll("term").map(String),
    days: formData.getAll("days").map(String),
    min: String(formData.get("min") ?? ""),
    max: String(formData.get("max") ?? ""),
  };
  if (interests.length < MIN_CHARS) {
    return { status: "error", message: "Tell us a bit more about your interests (a sentence or two).", form };
  }
  if (interests.length > MAX_CHARS) {
    return { status: "error", message: `Please keep it under ${MAX_CHARS} characters.`, form };
  }

  // Server actions are public endpoints: re-check sign-in here, not just in the proxy.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const devSkip = process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true";
  if (!data?.claims && !devSkip) {
    return { status: "error", message: "Please sign in again.", form };
  }

  const params: Record<string, string[]> = {};
  for (const key of ["term", "days", "min", "max"]) params[key] = formData.getAll(key).map(String);
  const { terms, days, minUnits, maxUnits } = parseCourseSearch(params);

  try {
    if (!devSkip && !(await tryUseRecommendation(DAILY_LIMIT))) {
      return { status: "error", message: `You've reached today's limit of ${DAILY_LIMIT} recommendation requests. Please try again tomorrow.`, form };
    }
    const student = await getStudentContext();
    const result = await recommend(
      { interests, filters: { terms, days, minUnits, maxUnits }, student },
      { generateKeywords, searchCandidates, getRules: getPrereqRules, rank: rankCandidates },
    );
    return { status: "done", result, form };
  } catch (err) {
    console.error("getRecommendations failed", err);
    return { status: "error", message: "Something went wrong getting recommendations. Please try again.", form };
  }
}
