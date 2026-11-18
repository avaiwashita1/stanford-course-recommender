// Helpers for course codes like "CS 106B".

/** "cs106b", "CS 106B", "cs-106b" -> "CS 106B". Returns null if it doesn't look like a code. */
export function normalizeCourseCode(input: string): string | null {
  const m = input.trim().match(/^([A-Za-z&]{2,10})[\s-]*(\d{1,4}[A-Za-z]{0,4})$/);
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : null;
}

/** "106B" -> 106, "10SC" -> 10, "ABC" -> 0. Used for sorting. */
export function codeNumber(code: string): number {
  const m = code.match(/^\d+/);
  return m ? Number(m[0]) : 0;
}
