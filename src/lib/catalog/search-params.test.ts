import { describe, expect, it } from "vitest";
import { hasAnyCriteria, parseCourseSearch } from "./search-params";

describe("parseCourseSearch", () => {
  it("parses all fields", () => {
    expect(
      parseCourseSearch({ q: " machine learning ", term: ["Winter", "Spring"], days: ["Tue", "Thu"], min: "3", max: "4" }),
    ).toEqual({ q: "machine learning", terms: ["Winter", "Spring"], days: ["Tue", "Thu"], minUnits: 3, maxUnits: 4, canTakeOnly: false });
    expect(parseCourseSearch({ canTake: "1" }).canTakeOnly).toBe(true);
  });
  it("ignores invalid values", () => {
    expect(parseCourseSearch({ term: "Fall", days: ["Tuesday", "Thu"], min: "abc", max: "-1" })).toEqual({
      q: "",
      terms: [],
      days: ["Thu"],
      minUnits: undefined,
      maxUnits: undefined,
      canTakeOnly: false,
    });
  });
  it("detects empty searches", () => {
    expect(hasAnyCriteria(parseCourseSearch({}))).toBe(false);
    expect(hasAnyCriteria(parseCourseSearch({ days: "Mon" }))).toBe(true);
  });
});
