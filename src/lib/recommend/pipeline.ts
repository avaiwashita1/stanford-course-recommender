// Recommendation pipeline. AI is used only for (1) turning interests into search phrases and
// (2) ranking/explaining. Eligibility, filters and "already taken" are decided by code, and the
// AI's picks are checked against the eligible candidate list before anything is shown.
import { formatUnits } from "@/lib/catalog/format";
import type { CourseFilters } from "@/lib/catalog/filters";
import type { Course } from "@/lib/catalog/types";
import { annotateCourses, canTake, type AnnotatedCourse } from "@/lib/prereqs/annotate";
import type { StoredPrereqRule } from "@/lib/prereqs/schema";
import type { RankCandidate, Ranked } from "./ai";

export const MAX_CANDIDATES = 60;
export const MAX_RECOMMENDATIONS = 10;
const DESCRIPTION_CHARS = 350;

export interface RecommendInput {
  interests: string;
  filters: CourseFilters;
  completed: ReadonlySet<string>;
}

export interface RecommendDeps {
  generateKeywords(interests: string): Promise<string[]>;
  /** Returns courses matching any keyword AND the filters, best text match first. */
  searchCandidates(keywords: string[], filters: CourseFilters): Promise<Course[]>;
  getRules(courseIds: string[]): Promise<Map<string, StoredPrereqRule>>;
  rank(interests: string, candidates: RankCandidate[]): Promise<Ranked>;
}

export interface Recommendation extends AnnotatedCourse {
  reason: string;
}

export interface RecommendResult {
  recommendations: Recommendation[];
  keywords: string[];
  candidateCount: number;
}

export function cleanKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  return keywords
    .map((k) => k.toLowerCase().replace(/[^a-z0-9&+\- ]/g, " ").replace(/\s+/g, " ").trim())
    .filter((k) => k.length >= 2 && k.length <= 40 && !seen.has(k) && seen.add(k))
    .slice(0, 12);
}

export function toRankCandidate(c: Course): RankCandidate {
  const description = c.description.length > DESCRIPTION_CHARS ? `${c.description.slice(0, DESCRIPTION_CHARS)}…` : c.description;
  return { courseId: c.id, title: c.title, units: formatUnits(c), quarters: c.terms, description };
}

export async function recommend(input: RecommendInput, deps: RecommendDeps): Promise<RecommendResult> {
  const keywords = cleanKeywords(await deps.generateKeywords(input.interests));
  if (keywords.length === 0) return { recommendations: [], keywords, candidateCount: 0 };

  const found = await deps.searchCandidates(keywords, input.filters);
  const rules = await deps.getRules(found.map((c) => c.id));
  const eligible = annotateCourses(found, rules, input.completed).filter(canTake).slice(0, MAX_CANDIDATES);
  if (eligible.length === 0) return { recommendations: [], keywords, candidateCount: 0 };

  const ranked = await deps.rank(input.interests, eligible.map((a) => toRankCandidate(a.course)));

  // Never trust the model's list blindly: keep only real, eligible candidates, once each.
  const byId = new Map(eligible.map((a) => [a.course.id, a]));
  const used = new Set<string>();
  const recommendations: Recommendation[] = [];
  for (const r of ranked) {
    const a = byId.get(r.courseId.trim());
    if (!a || used.has(a.course.id)) continue;
    used.add(a.course.id);
    recommendations.push({ ...a, reason: r.reason.trim() });
    if (recommendations.length >= MAX_RECOMMENDATIONS) break;
  }
  return { recommendations, keywords, candidateCount: eligible.length };
}
