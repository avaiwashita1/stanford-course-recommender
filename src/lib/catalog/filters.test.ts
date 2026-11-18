import { describe, expect, it } from "vitest";
import { matchesDays, matchesFilters, matchesTerms, matchesUnits } from "./filters";
import { course, meeting, section } from "./test-helpers";

describe("matchesUnits", () => {
  const c = course({ unitsMin: 3, unitsMax: 5 });
  it("matches when the ranges overlap", () => {
    expect(matchesUnits(c, 4, 4)).toBe(true);
    expect(matchesUnits(c, 1, 3)).toBe(true);
    expect(matchesUnits(c, 5, 10)).toBe(true);
    expect(matchesUnits(c)).toBe(true);
  });
  it("rejects when the ranges don't overlap", () => {
    expect(matchesUnits(c, 1, 2)).toBe(false);
    expect(matchesUnits(c, 6)).toBe(false);
  });
});

describe("matchesTerms", () => {
  const c = course({ terms: ["Winter", "Spring"] });
  it("matches any of the selected terms", () => {
    expect(matchesTerms(c, ["Spring"])).toBe(true);
    expect(matchesTerms(c, ["Autumn", "Winter"])).toBe(true);
    expect(matchesTerms(c, ["Autumn"])).toBe(false);
    expect(matchesTerms(c, [])).toBe(true);
  });
});

describe("matchesDays", () => {
  const tth = course({ sections: [section({ meetings: [meeting({ days: ["Tue", "Thu"] })] })] });

  it("matches when every meeting day is allowed", () => {
    expect(matchesDays(tth, ["Tue", "Thu"])).toBe(true);
    expect(matchesDays(tth, ["Mon", "Tue", "Wed", "Thu"])).toBe(true);
  });
  it("rejects when any meeting day is not allowed", () => {
    expect(matchesDays(tth, ["Tue"])).toBe(false);
    expect(matchesDays(tth, ["Mon", "Wed", "Fri"])).toBe(false);
  });
  it("ignores discussion sections (non-primary)", () => {
    const c = course({
      sections: [
        section({ meetings: [meeting({ days: ["Tue", "Thu"] })] }),
        section({ primary: false, component: "DIS", meetings: [meeting({ days: ["Fri"] })] }),
      ],
    });
    expect(matchesDays(c, ["Tue", "Thu"])).toBe(true);
  });
  it("does not match sections whose days are TBA", () => {
    const tba = course({ sections: [section({ meetings: [] })] });
    expect(matchesDays(tba, ["Mon"])).toBe(false);
    expect(matchesDays(tba, undefined)).toBe(true);
  });
  it("only considers sections in the selected terms", () => {
    const c = course({
      terms: ["Autumn", "Winter"],
      sections: [
        section({ term: "Autumn", meetings: [meeting({ days: ["Mon", "Wed"] })] }),
        section({ term: "Winter", meetings: [meeting({ days: ["Tue", "Thu"] })] }),
      ],
    });
    expect(matchesDays(c, ["Tue", "Thu"], ["Winter"])).toBe(true);
    expect(matchesDays(c, ["Tue", "Thu"], ["Autumn"])).toBe(false);
  });
});

describe("matchesFilters", () => {
  it("hides independent study unless asked", () => {
    const c = course({ independentStudy: true });
    expect(matchesFilters(c, {})).toBe(false);
    expect(matchesFilters(c, { includeIndependentStudy: true })).toBe(true);
  });
});
