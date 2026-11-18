import { describe, expect, it } from "vitest";
import { course } from "@/lib/catalog/test-helpers";
import { annotateCourses, canTake } from "./annotate";
import type { StoredPrereqRule } from "./schema";

const TEXT = "Prerequisite: CS 107.";
const rules = new Map<string, StoredPrereqRule>([
  [
    "CS 111",
    {
      courseId: "CS 111",
      sourceText: TEXT,
      rule: { groups: [{ anyOf: [{ kind: "course", value: "CS 107" }] }], recommended: ["CS 103"], corequisites: [], confidence: "high" },
    },
  ],
]);
const cs111 = course({ id: "CS 111", prereqText: TEXT });
const cs229 = course({ id: "CS 229", crossListings: ["STATS 229"] });

describe("annotateCourses", () => {
  it("combines eligibility and already-taken status", () => {
    const [a, b] = annotateCourses([cs111, cs229], rules, new Set(["CS 107", "STATS 229"]));
    expect(a).toMatchObject({ eligibility: "eligible", alreadyTaken: false, explanation: "You've taken CS 107.", recommended: ["CS 103"] });
    expect(b).toMatchObject({ eligibility: "no_prereqs", alreadyTaken: true });
    expect(canTake(a)).toBe(true);
    expect(canTake(b)).toBe(false);
  });

  it("flags missing prerequisites", () => {
    const [a] = annotateCourses([cs111], rules, new Set());
    expect(a.eligibility).toBe("missing");
    expect(canTake(a)).toBe(false);
  });
});
