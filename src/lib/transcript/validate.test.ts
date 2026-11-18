import { describe, expect, it } from "vitest";
import { toSavableRows } from "./validate";

describe("toSavableRows", () => {
  it("normalizes and keeps only counted courses", () => {
    expect(
      toSavableRows([
        { courseId: "cs106b", title: "Programming Abstractions", term: "2023-2024 Winter", status: "completed", source: "transcript" },
        { courseId: "PSYC 54N", title: "x", term: "2022-2023 Autumn", status: "withdrawn", source: "transcript" },
        { courseId: "CS 161", title: "Algorithms", term: "garbage", status: "in_progress", source: "hacker" },
        { courseId: "not a course", status: "completed" },
      ]),
    ).toEqual([
      { course_id: "CS 106B", title: "Programming Abstractions", term: "2023-2024 Winter", status: "completed", source: "transcript" },
      { course_id: "CS 161", title: "Algorithms", term: null, status: "in_progress", source: "manual" },
    ]);
  });

  it("removes duplicates", () => {
    const rows = toSavableRows([
      { courseId: "CS 106B", status: "completed" },
      { courseId: "cs 106b", status: "completed" },
    ]);
    expect(rows).toHaveLength(1);
  });

  it("rejects non-lists and oversized lists", () => {
    expect(() => toSavableRows("nope")).toThrow();
    expect(() => toSavableRows(Array.from({ length: 201 }, () => ({})))).toThrow();
  });
});
