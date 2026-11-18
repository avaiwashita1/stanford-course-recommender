import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCoursesXml } from "./parse-xml";

const xml = readFileSync(join(__dirname, "__fixtures__/sample.xml"), "utf8");
const [cs161, cs199] = parseCoursesXml(xml);

describe("parseCoursesXml", () => {
  it("reads basic course fields", () => {
    expect(cs161).toMatchObject({
      id: "CS 161",
      title: "Design and Analysis of Algorithms",
      unitsMin: 3,
      unitsMax: 5,
      gers: ["GER:DB-EngrAppSci", "WAY-FR"],
      courseId: 105687,
      prereqText: "Prerequisite: 106B or 106X; 103 or 103B; 109 or STATS 116.",
      terms: ["Winter", "Spring"],
      independentStudy: false,
    });
  });

  it("reads meeting days and times", () => {
    const lec = cs161.sections.find((s) => s.classId === 1933)!;
    expect(lec.primary).toBe(true);
    expect(lec.instructors).toEqual(["Aviad Rubinstein"]);
    expect(lec.meetings).toEqual([
      { days: ["Mon", "Wed", "Fri"], start: "13:30", end: "14:50", location: "Packrd101" },
    ]);
  });

  it("marks discussion sections (no units) as non-primary", () => {
    const dis = cs161.sections.find((s) => s.classId === 2000)!;
    expect(dis.primary).toBe(false);
    expect(dis.meetings[0].days).toEqual(["Thu"]);
  });

  it("keeps sections with TBA times but no placeholder meetings", () => {
    const spring = cs161.sections.find((s) => s.classId === 2001)!;
    expect(spring.meetings).toEqual([]);
  });

  it("flags independent-study-only courses and drops their sections", () => {
    expect(cs199.independentStudy).toBe(true);
    expect(cs199.sections).toEqual([]);
    expect(cs199.terms).toEqual(["Autumn"]);
  });
});
