import { describe, expect, it } from "vitest";
import { meeting, section } from "@/lib/catalog/test-helpers";
import { conflictingCourses, meetingsOverlap, planConflicts, termsBefore } from "./conflicts";
import type { PlannedEntry } from "./types";

const planned = (courseId: string, term: PlannedEntry["term"], meetings = [meeting()]): PlannedEntry => ({
  courseId, title: "", term, classId: 1, meetings, unitsMin: 3, unitsMax: 5, sectionLabel: "LEC 01",
});

describe("meetingsOverlap", () => {
  const mwf1030 = meeting({ days: ["Mon", "Wed", "Fri"], start: "10:30", end: "11:20" });
  it("detects overlapping times on a shared day", () => {
    expect(meetingsOverlap(mwf1030, meeting({ days: ["Wed"], start: "11:00", end: "12:00" }))).toBe(true);
  });
  it("allows back-to-back classes", () => {
    expect(meetingsOverlap(mwf1030, meeting({ days: ["Mon"], start: "11:20", end: "12:00" }))).toBe(false);
  });
  it("ignores different days and unknown times", () => {
    expect(meetingsOverlap(mwf1030, meeting({ days: ["Tue", "Thu"], start: "10:30", end: "11:20" }))).toBe(false);
    expect(meetingsOverlap(mwf1030, meeting({ days: [], start: null, end: null }))).toBe(false);
  });
});

describe("conflictingCourses", () => {
  const plan = [planned("CS 107", "Winter"), planned("MATH 51", "Autumn")];
  it("only compares within the same term", () => {
    expect(conflictingCourses(section({ term: "Winter" }), plan)).toEqual(["CS 107"]);
    expect(conflictingCourses(section({ term: "Spring" }), plan)).toEqual([]);
  });
  it("can ignore the course itself (when changing its section)", () => {
    expect(conflictingCourses(section({ term: "Winter" }), plan, "CS 107")).toEqual([]);
  });
  it("never conflicts with TBA sections", () => {
    expect(conflictingCourses(section({ term: "Winter", meetings: [] }), plan)).toEqual([]);
  });
});

describe("termsBefore / planConflicts", () => {
  it("orders the academic year", () => {
    expect(termsBefore("Autumn")).toEqual([]);
    expect(termsBefore("Spring")).toEqual(["Autumn", "Winter"]);
  });
  it("lists overlapping planned pairs", () => {
    expect(planConflicts([planned("A", "Winter"), planned("B", "Winter"), planned("C", "Spring")])).toEqual([["A", "B"]]);
  });
});
