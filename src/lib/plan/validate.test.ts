import { describe, expect, it } from "vitest";
import { course, meeting, section } from "@/lib/catalog/test-helpers";
import { checkAddToPlan } from "./validate";
import type { PlannedEntry } from "./types";

const c = course({ id: "CS 107", terms: ["Winter"], sections: [section({ classId: 5, term: "Winter" })] });
const clash: PlannedEntry = { courseId: "MATH 51", title: "", term: "Winter", classId: 1, meetings: [meeting()], unitsMin: 5, unitsMax: 5, sectionLabel: null };

describe("checkAddToPlan", () => {
  it("accepts a valid, conflict-free section", () => {
    expect(checkAddToPlan(c, "Winter", 5, [])).toEqual({ ok: true });
  });
  it("rejects bad terms, sections and conflicts", () => {
    expect(checkAddToPlan(undefined, "Winter", 5, [])).toMatchObject({ ok: false });
    expect(checkAddToPlan(c, "Autumn", 5, [])).toMatchObject({ ok: false, message: "CS 107 isn't offered in Autumn." });
    expect(checkAddToPlan(c, "Winter", 99, [])).toMatchObject({ ok: false });
    expect(checkAddToPlan(c, "Winter", null, [])).toMatchObject({ ok: false, message: "Please choose a section." });
    expect(checkAddToPlan(c, "Winter", 5, [clash])).toEqual({ ok: false, message: "That time conflicts with MATH 51." });
  });
  it("allows courses without listed sections", () => {
    const tba = course({ terms: ["Spring"], sections: [] });
    expect(checkAddToPlan(tba, "Spring", null, [])).toEqual({ ok: true });
  });
});
