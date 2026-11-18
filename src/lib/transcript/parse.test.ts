import { describe, expect, it } from "vitest";
import { parseTranscriptLines } from "./parse";

// A made-up transcript in the same shape pagesToLines() produces from the real PDF.
const LINES = `
Undergraduate Unofficial Transcript - Detailed
Name : Student,Test
Student ID : 00000000
--------- Advanced Placement Test Credit ---------
2022-2023 Autumn
Total Quarter Units Posted: 0.00
--------- Beginning of Academic Record ---------
2022-2023 Autumn
Course Cmpt Title Attempted Earned Grade
CHEM 31A LEC CHEMICAL PRINCIPLES I 5.00 0.00 W 11/03/2022
Jane Instructor
PSYC 54N ISF GENES, MEMES AND BEHAVIOR 3.00 0.00 W 11/03/2022
UG Term GPA 0.000 Term Totals 8.00 0.00
2023-2024 Autumn
Course Cmpt Title Attempted Earned Grade
CHEM 31A LEC CHEMICAL PRINCIPLES I 5.00 5.00 A
CS 106A LEC PROGRAMMING METHODOLOGY 5.00 5.00 A
CS 522 SEM SEMINAR IN ARTIFICIAL 1.00 1.00 S
INTELLIGENCE IN HEALTHCARE
2023-2024 Winter
Course Cmpt Title Attempted Earned Grade
MATH 51 LEC LINEAR ALGEBRA, 5.00 5.00 B-
PWR 2STA SEM WRITING & RHETORIC 2: MACHINE 4.00 4.00 A
ECON 1 LEC PRINCIPLES OF ECONOMICS 5.00 0.00 NP
CS 255 LEC INTRODUCTION TO 3.00 3.00 CR
2023-2024 Summer
OCEANS 10SC SCS DISCOVER MONTEREY BAY 2.00 2.00 S
2025-2026 Autumn
Course Cmpt Title Attempted Earned Grade
CS 161 LEC DESIGN AND ANALYSIS OF 5.00 0.00
UG Cum GPA 3.919 Cum Totals 145.00 133.00
`.trim().split("\n");

const parsed = parseTranscriptLines(LINES);
const get = (id: string) => parsed.find((c) => c.courseId === id);

describe("parseTranscriptLines", () => {
  it("finds every course once", () => {
    expect(parsed.map((c) => c.courseId).sort()).toEqual(
      ["CHEM 31A", "CS 106A", "CS 161", "CS 255", "CS 522", "ECON 1", "MATH 51", "OCEANS 10SC", "PSYC 54N", "PWR 2STA"].sort(),
    );
  });

  it("records the quarter and a readable title", () => {
    expect(get("CS 106A")).toEqual({
      courseId: "CS 106A",
      title: "Programming Methodology",
      term: "2023-2024 Autumn",
      status: "completed",
      source: "transcript",
    });
  });

  it("joins titles that wrap onto the next line, but not instructor names", () => {
    expect(get("CS 522")?.title).toBe("Seminar in Artificial Intelligence in Healthcare");
    expect(get("CHEM 31A")?.title).toBe("Chemical Principles I");
  });

  it("treats letter grades, S and CR as completed", () => {
    expect(get("MATH 51")?.status).toBe("completed");
    expect(get("CS 522")?.status).toBe("completed");
    expect(get("CS 255")?.status).toBe("completed");
  });

  it("marks withdrawals and no-pass as not counted", () => {
    expect(get("PSYC 54N")?.status).toBe("withdrawn");
    expect(get("ECON 1")?.status).toBe("not_passed");
  });

  it("keeps the passing attempt when a course was retaken", () => {
    expect(get("CHEM 31A")).toMatchObject({ status: "completed", term: "2023-2024 Autumn" });
  });

  it("marks courses without a grade as in progress", () => {
    expect(get("CS 161")).toMatchObject({ status: "in_progress", term: "2025-2026 Autumn" });
  });

  it("never captures names, IDs or grades", () => {
    const text = JSON.stringify(parsed);
    expect(text).not.toMatch(/Student,Test|00000000|"B-"|Jane/);
  });
});
