import { describe, expect, it } from "vitest";
import { mergeTranscript } from "./merge";
import type { TranscriptCourse } from "./parse";

const c = (courseId: string, source: TranscriptCourse["source"]): TranscriptCourse => ({
  courseId,
  title: "",
  term: null,
  status: "completed",
  source,
});

describe("mergeTranscript", () => {
  it("replaces old transcript rows and keeps manual ones", () => {
    const merged = mergeTranscript(
      [c("CS 106A", "transcript"), c("MATH 19", "manual"), c("CS 106B", "manual")],
      [c("CS 106B", "transcript"), c("CS 107", "transcript")],
    );
    expect(merged.map((x) => `${x.courseId}:${x.source}`)).toEqual([
      "CS 106B:transcript",
      "CS 107:transcript",
      "MATH 19:manual",
    ]);
  });
});
