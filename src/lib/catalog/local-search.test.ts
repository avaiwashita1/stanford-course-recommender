import { describe, expect, it } from "vitest";
import { searchLocal } from "./local-search";
import { course } from "./test-helpers";

const courses = [
  course({ id: "CS 229", subject: "CS", code: "229", title: "Machine Learning", description: "Statistical learning." }),
  course({ id: "CS 107", subject: "CS", code: "107", title: "Computer Organization", description: "Machine-level code." }),
  course({ id: "MATH 51", subject: "MATH", code: "51", title: "Linear Algebra", description: "Matrices." }),
];

describe("searchLocal", () => {
  it("finds exact course codes first", () => {
    expect(searchLocal(courses, "cs107")[0].id).toBe("CS 107");
  });
  it("ranks title matches above description matches", () => {
    expect(searchLocal(courses, "machine").map((c) => c.id)).toEqual(["CS 229", "CS 107"]);
  });
  it("requires every word to match", () => {
    expect(searchLocal(courses, "machine matrices")).toEqual([]);
  });
  it("matches a subject code", () => {
    expect(searchLocal(courses, "math").map((c) => c.id)).toEqual(["MATH 51"]);
  });
});
