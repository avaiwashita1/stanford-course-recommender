import type { TranscriptCourse } from "./parse";

/**
 * Combines a freshly parsed transcript with the student's current list:
 * transcript rows replace earlier transcript rows; manual additions are kept
 * unless the transcript now includes that course.
 */
export function mergeTranscript(current: TranscriptCourse[], parsed: TranscriptCourse[]): TranscriptCourse[] {
  const fromTranscript = new Set(parsed.map((c) => c.courseId));
  const manual = current.filter((c) => c.source === "manual" && !fromTranscript.has(c.courseId));
  return [...parsed, ...manual];
}
