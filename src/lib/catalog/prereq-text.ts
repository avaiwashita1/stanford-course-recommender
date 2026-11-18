// Pulls the prerequisite sentence(s) out of a course description.
// This is only text extraction; turning it into rules happens in a later step.

const PREREQ_RE = /\b(?:pre-?requisites?|prereqs?)\s*:?\s*/i;

export function extractPrereqText(description: string): string | null {
  const match = PREREQ_RE.exec(description);
  if (!match) return null;
  // "Prerequisites" in normal prose (e.g. "there are no prerequisites") is still useful
  // context, so we start at the keyword and take the rest of that sentence/paragraph,
  // stopping at a following "Corequisite"/"Students may not earn credit" style sentence.
  let text = description.slice(match.index).trim();
  const stop = text.search(/\s(?:Students may not|Same as:|Cross-listed|Formerly|Enrollment limited)/i);
  if (stop > 0) text = text.slice(0, stop).trim();
  return text.length > 600 ? `${text.slice(0, 600)}…` : text;
}
