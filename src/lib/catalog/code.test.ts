import { describe, expect, it } from "vitest";
import { codeNumber, normalizeCourseCode } from "./code";

describe("normalizeCourseCode", () => {
  it("normalizes common spellings", () => {
    expect(normalizeCourseCode("cs106b")).toBe("CS 106B");
    expect(normalizeCourseCode("CS 106B")).toBe("CS 106B");
    expect(normalizeCourseCode(" math-51 ")).toBe("MATH 51");
    expect(normalizeCourseCode("OSPFLOR 78F")).toBe("OSPFLOR 78F");
  });
  it("rejects non-codes", () => {
    expect(normalizeCourseCode("machine learning")).toBeNull();
    expect(normalizeCourseCode("CS")).toBeNull();
  });
});

describe("codeNumber", () => {
  it("extracts the leading number", () => {
    expect(codeNumber("106B")).toBe(106);
    expect(codeNumber("10SC")).toBe(10);
    expect(codeNumber("ABC")).toBe(0);
  });
});
