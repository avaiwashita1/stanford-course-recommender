import { describe, expect, it } from "vitest";
import { normalizeRule } from "./normalize";
import type { AiPrereqRule } from "./schema";

const catalog = {
  ids: new Set(["CS 229", "STATS 229", "CS 106B", "CS 111", "PWR 1LS", "PWR 1AB"]),
  crossListings: new Map([["CS 229", ["STATS 229"]]]),
};
const rule = (groups: AiPrereqRule["groups"], extra: Partial<AiPrereqRule> = {}): AiPrereqRule => ({
  groups,
  recommended: [],
  corequisites: [],
  confidence: "high",
  ...extra,
});
const course = (value: string) => ({ kind: "course" as const, value });

describe("normalizeRule", () => {
  it("normalizes codes, adds cross-listings, demotes invalid codes and drops empty groups", () => {
    const r = normalizeRule(
      rule([
        { anyOf: [course("cs229"), course("CS 229")] },
        { anyOf: [course("programming experience")] },
        { anyOf: [] },
      ]),
      catalog,
    );
    expect(r.groups).toEqual([
      { anyOf: [course("CS 229"), course("STATS 229")] },
      { anyOf: [{ kind: "other", value: "programming experience" }] },
    ]);
  });

  it("turns non-course codes with lettered variants into families", () => {
    const r = normalizeRule(rule([{ anyOf: [course("PWR 1")] }]), catalog);
    expect(r.groups).toEqual([{ anyOf: [{ kind: "family", value: "PWR 1" }] }]);
  });

  it("treats free-text options that are just a code as courses", () => {
    const r = normalizeRule(rule([{ anyOf: [{ kind: "other", value: "PWR1" }] }]), catalog);
    expect(r.groups).toEqual([{ anyOf: [{ kind: "family", value: "PWR 1" }] }]);
  });

  it("adds an equivalent option for courses not offered this year", () => {
    const r = normalizeRule(rule([{ anyOf: [course("CS 110")] }]), catalog);
    expect(r.groups[0].anyOf).toEqual([course("CS 110"), { kind: "other", value: "equivalent (CS 110 isn't offered this year)" }]);
  });

  it("drops groups that are corequisites", () => {
    const r = normalizeRule(
      rule([{ anyOf: [course("CS 106B"), { kind: "other", value: "equivalent" }] }, { anyOf: [course("CS 111")] }], {
        corequisites: ["CS106B"],
      }),
      catalog,
    );
    expect(r.groups).toEqual([{ anyOf: [course("CS 111")] }]);
  });
});
