import { describe, expect, it } from "vitest";
import { course, meeting, section } from "@/lib/catalog/test-helpers";
import type { PlannedEntry, StudentContext } from "@/lib/plan/types";
import { annotateCourses, canTake, completedBy } from "./annotate";
import type { StoredPrereqRule } from "./schema";

const TEXT = "Prerequisite: CS 106B.";
const rules = new Map<string, StoredPrereqRule>([
  ["CS 107", { courseId: "CS 107", sourceText: TEXT, rule: { groups: [{ anyOf: [{ kind: "course", value: "CS 106B" }] }], recommended: ["CS 103"], corequisites: [], confidence: "high" } }],
]);
const mwf = meeting({ days: ["Mon", "Wed", "Fri"], start: "10:30", end: "11:20" });
const tth = meeting({ days: ["Tue", "Thu"], start: "13:30", end: "14:50" });
const cs107 = course({
  id: "CS 107",
  prereqText: TEXT,
  terms: ["Autumn", "Winter"],
  sections: [section({ term: "Autumn", meetings: [mwf] }), section({ classId: 2, term: "Winter", meetings: [mwf] })],
});
const plannedEntry = (courseId: string, term: PlannedEntry["term"], meetings = [mwf]): PlannedEntry => ({
  courseId, title: "", term, classId: 9, meetings, unitsMin: 5, unitsMax: 5, sectionLabel: "LEC 01",
});
const ctx = (completed: string[], planned: PlannedEntry[] = []): StudentContext => ({ completed: new Set(completed), planned });

describe("annotateCourses", () => {
  it("is eligible when the prerequisite is completed", () => {
    const [a] = annotateCourses([cs107], rules, ctx(["CS 106B"]));
    expect(a).toMatchObject({ eligibility: "eligible", viableTerms: ["Autumn", "Winter"], explanation: "You've taken CS 106B." });
    expect(canTake(a)).toBe(true);
  });

  it("counts courses planned in an EARLIER quarter (106B in Autumn -> 107 in Winter)", () => {
    const [a] = annotateCourses([cs107], rules, ctx([], [plannedEntry("CS 106B", "Autumn", [tth])]));
    expect(a.viableTerms).toEqual(["Winter"]);
    expect(a.eligibility).toBe("eligible");
    expect(a.explanation).toBe("You've taken CS 106B (planned Autumn).");
  });

  it("does not count a prerequisite planned in the same quarter", () => {
    const [a] = annotateCourses([cs107], rules, ctx([], [plannedEntry("CS 106B", "Winter", [tth])]), { terms: ["Winter"] });
    expect(a.eligibility).toBe("missing");
    expect(canTake(a)).toBe(false);
  });

  it("drops quarters where every lecture clashes with the plan", () => {
    const [a] = annotateCourses([cs107], rules, ctx(["CS 106B"], [plannedEntry("MATH 51", "Autumn", [mwf])]));
    expect(a.viableTerms).toEqual(["Winter"]);
    expect(a.conflictTerms).toEqual(["Autumn"]);
  });

  it("lists section options per quarter with conflicts", () => {
    const [a] = annotateCourses([cs107], rules, ctx(["CS 106B"], [plannedEntry("MATH 51", "Autumn", [mwf])]));
    expect(a.options).toEqual([
      { term: "Autumn", eligibility: "eligible", sections: [{ classId: 1, label: "LEC 01", schedule: "Mon Wed Fri 10:30am–11:20am", conflictsWith: ["MATH 51"], fitsDays: true }] },
      { term: "Winter", eligibility: "eligible", sections: [{ classId: 2, label: "LEC 01", schedule: "Mon Wed Fri 10:30am–11:20am", conflictsWith: [], fitsDays: true }] },
    ]);
  });

  it("respects day filters per section", () => {
    const [a] = annotateCourses([cs107], rules, ctx(["CS 106B"]), { days: ["Tue", "Thu"] });
    expect(a.viableTerms).toEqual([]);
  });

  it("marks planned and taken courses (including cross-listings)", () => {
    const [p] = annotateCourses([cs107], rules, ctx(["CS 106B"], [plannedEntry("CS 107", "Winter")]));
    expect(p.plannedTerm).toBe("Winter");
    expect(canTake(p)).toBe(false);
    const [t] = annotateCourses([course({ id: "CS 229", crossListings: ["STATS 229"] })], rules, ctx(["STATS 229"]));
    expect(t.alreadyTaken).toBe(true);
  });

  it("completedBy includes only earlier quarters", () => {
    const c = ctx(["X"], [plannedEntry("A", "Autumn"), plannedEntry("B", "Winter")]);
    expect([...completedBy("Winter", c)].sort()).toEqual(["A", "X"]);
    expect([...completedBy("Autumn", c)]).toEqual(["X"]);
  });
});
