import { describe, expect, it } from "vitest";
import { checkEligibility, explainEligibility } from "./evaluate";
import type { PrereqRule } from "./schema";

const course = (id: string) => ({ kind: "course" as const, value: id });
const other = (text: string) => ({ kind: "other" as const, value: text });
const rule = (groups: PrereqRule["groups"], extra: Partial<PrereqRule> = {}): PrereqRule => ({
  groups,
  recommended: [],
  corequisites: [],
  confidence: "high",
  ...extra,
});

// CS 161: "Prerequisite: 106B or 106X; 103 or 103B; 109 or STATS 116."
const TEXT = "Prerequisite: 106B or 106X; 103 or 103B; 109 or STATS 116.";
const cs161 = {
  sourceText: TEXT,
  rule: rule([
    { anyOf: [course("CS 106B"), course("CS 106X")] },
    { anyOf: [course("CS 103"), course("CS 103B")] },
    { anyOf: [course("CS 109"), course("STATS 116")] },
  ]),
};
const check = (completed: string[], stored = cs161, text = TEXT, eq = new Map<string, string[]>()) =>
  checkEligibility({ prereqText: text }, stored, new Set(completed), eq);

describe("checkEligibility", () => {
  it("is eligible when every group is met", () => {
    const r = check(["CS 106B", "CS 103", "STATS 116"]);
    expect(r.status).toBe("eligible");
    expect(r.groups.map((g) => g.metBy)).toEqual(["CS 106B", "CS 103", "STATS 116"]);
    expect(explainEligibility(r)).toBe("You've taken CS 106B, CS 103 and STATS 116.");
  });

  it("is missing when any group is unmet", () => {
    const r = check(["CS 106B", "CS 103"]);
    expect(r.status).toBe("missing");
    expect(explainEligibility(r)).toBe("Missing: CS 109 or STATS 116.");
  });

  it("treats 'or consent of instructor' as unverified, not missing", () => {
    const stored = { sourceText: "x", rule: rule([{ anyOf: [course("CS 111"), other("consent of instructor")] }]) };
    const r = check([], stored, "x");
    expect(r.status).toBe("unverified");
    expect(explainEligibility(r)).toBe("Can't verify: CS 111 or consent of instructor.");
    expect(check(["CS 111"], stored, "x").status).toBe("eligible");
  });

  it("marks standalone conditions as unverified even when courses are met", () => {
    const stored = {
      sourceText: "x",
      rule: rule([{ anyOf: [course("CS 106B")] }, { anyOf: [other("consent of instructor")] }]),
    };
    const r = check(["CS 106B"], stored, "x");
    expect(r.status).toBe("unverified");
    expect(explainEligibility(r)).toBe("You've taken CS 106B. Can't verify: consent of instructor.");
  });

  it("missing beats unverified", () => {
    const stored = {
      sourceText: "x",
      rule: rule([{ anyOf: [course("CS 107")] }, { anyOf: [other("consent of instructor")] }]),
    };
    expect(check([], stored, "x").status).toBe("missing");
  });

  it("accepts cross-listed equivalents", () => {
    const stored = { sourceText: "x", rule: rule([{ anyOf: [course("CS 229")] }]) };
    const eq = new Map([["CS 229", ["STATS 229"]]]);
    const r = check(["STATS 229"], stored, "x", eq);
    expect(r.status).toBe("eligible");
    expect(r.groups[0].metBy).toBe("STATS 229");
  });

  it("matches course families like PWR 1", () => {
    const stored = { sourceText: "x", rule: rule([{ anyOf: [{ kind: "family", value: "PWR 1" }] }]) };
    expect(check(["PWR 1LS"], stored, "x").groups[0].metBy).toBe("PWR 1LS");
    expect(check(["PWR 2STA"], stored, "x").status).toBe("missing");
    expect(check(["PWR 10"], stored, "x").status).toBe("missing"); // digits don't count as a variant
  });

  it("handles courses without prerequisites or without a parsed rule", () => {
    expect(checkEligibility({ prereqText: null }, null, new Set()).status).toBe("no_prereqs");
    expect(checkEligibility({ prereqText: "Prerequisite: CS 106A" }, null, new Set()).status).toBe("unverified");
  });

  it("treats a rule with no hard requirements as no prerequisites", () => {
    const stored = { sourceText: "x", rule: rule([], { recommended: ["CS 107"] }) };
    expect(check([], stored, "x").status).toBe("no_prereqs");
  });

  it("downgrades stale or low-confidence rules to unverified", () => {
    expect(check(["CS 106B", "CS 103", "CS 109"], cs161, "Prerequisite: something new").status).toBe("unverified");
    const low = { ...cs161, rule: { ...cs161.rule, confidence: "low" as const } };
    const r = check(["CS 106B", "CS 103", "CS 109"], low);
    expect(r.status).toBe("unverified");
    expect(explainEligibility(r)).toContain("ambiguous");
  });

  it("never hides a course based on a stale rule", () => {
    const r = check([], cs161, "changed");
    expect(r.status).toBe("unverified");
    expect(explainEligibility(r)).toContain("Possibly missing: CS 106B or CS 106X");
  });
});
