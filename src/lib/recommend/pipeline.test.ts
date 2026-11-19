import { describe, expect, it, vi } from "vitest";
import { course } from "@/lib/catalog/test-helpers";
import type { StoredPrereqRule } from "@/lib/prereqs/schema";
import { cleanKeywords, recommend, type RecommendDeps } from "./pipeline";

const TEXT = "Prerequisite: CS 107.";
const courses = [
  course({ id: "CS 229", title: "Machine Learning" }),
  course({ id: "CS 111", title: "Operating Systems", prereqText: TEXT }),
  course({ id: "CS 106B", title: "Programming Abstractions" }),
];
const rules = new Map<string, StoredPrereqRule>([
  ["CS 111", { courseId: "CS 111", sourceText: TEXT, rule: { groups: [{ anyOf: [{ kind: "course", value: "CS 107" }] }], recommended: [], corequisites: [], confidence: "high" } }],
]);

function deps(overrides: Partial<RecommendDeps> = {}): RecommendDeps {
  return {
    generateKeywords: vi.fn(async () => ["Machine Learning", "machine learning", "systems!"]),
    searchCandidates: vi.fn(async () => courses),
    getRules: vi.fn(async () => rules),
    rank: vi.fn(async () => [
      { courseId: "CS 111", reason: "missing prereq, must be dropped" },
      { courseId: "MADE UP 1", reason: "hallucinated" },
      { courseId: "CS 229", reason: "  You like ML.  " },
      { courseId: "CS 229", reason: "duplicate" },
    ]),
    ...overrides,
  };
}

describe("recommend", () => {
  it("only sends eligible, untaken courses to the AI and keeps only valid picks", async () => {
    const d = deps();
    const result = await recommend({ interests: "ML", filters: {}, student: { completed: new Set(["CS 106B"]), planned: [] } }, d);

    const sent = (d.rank as ReturnType<typeof vi.fn>).mock.calls[0][1].map((c: { courseId: string }) => c.courseId);
    expect(sent).toEqual(["CS 229"]); // CS 111 missing CS 107, CS 106B already taken
    expect(result.recommendations.map((r) => [r.course.id, r.reason])).toEqual([["CS 229", "You like ML."]]);
    expect(result.keywords).toEqual(["machine learning", "systems"]);
    expect(result.candidateCount).toBe(1);
  });

  it("skips the ranking call when nothing is eligible", async () => {
    const d = deps({ searchCandidates: vi.fn(async () => []) });
    const result = await recommend({ interests: "x", filters: {}, student: { completed: new Set(), planned: [] } }, d);
    expect(result.recommendations).toEqual([]);
    expect(d.rank).not.toHaveBeenCalled();
  });
});

describe("cleanKeywords", () => {
  it("lowercases, strips punctuation, dedupes and caps", () => {
    expect(cleanKeywords(["  Deep   Learning ", "deep learning", "x", "C++", "a".repeat(50)])).toEqual(["deep learning", "c++"]);
    expect(cleanKeywords(Array.from({ length: 20 }, (_, i) => `topic ${i}`))).toHaveLength(12);
  });
});
