// Pulls the prerequisite sentence(s) out of a course description.
// This is only text extraction; turning it into rules happens in the AI parsing step.

// The usual catalog form: "Prerequisite: ..." / "Prerequisites: ..." / "Prereq: ..."
const LABELED_RE = /\b(?:pre-?requisites?|prereqs?)\s*:\s*/i;
// Any mention, e.g. "...at an introductory level, without prerequisites."
const MENTION_RE = /\b(?:pre-?requisites?|prereqs?)\b/i;
const STOP_RE = /\s(?:Students may not|Same as:|Cross-listed|Formerly|Enrollment limited)/i;
const MAX = 600;

const clip = (s: string) => (s.length > MAX ? `${s.slice(0, MAX)}…` : s);

export function extractPrereqText(description: string): string | null {
  const labeled = LABELED_RE.exec(description);
  if (labeled) {
    let text = description.slice(labeled.index).trim();
    const stop = text.search(STOP_RE);
    if (stop > 0) text = text.slice(0, stop).trim();
    return clip(text);
  }

  const mention = MENTION_RE.exec(description);
  if (!mention) return null;
  // No label: take the whole sentence containing the word, plus the next sentence
  // (which often says "Recommended: ..."), so the meaning isn't cut off mid-sentence.
  const before = description.slice(0, mention.index);
  const sentenceStart = Math.max(before.lastIndexOf(". "), before.lastIndexOf("? "), before.lastIndexOf("! "));
  const start = sentenceStart >= 0 ? sentenceStart + 2 : 0;
  const rest = description.slice(mention.index);
  const ends = [...rest.matchAll(/[.!?)](\s|$)/g)].map((m) => m.index! + 1);
  const end = mention.index + (ends[1] ?? ends[0] ?? rest.length);
  return clip(description.slice(start, end).trim());
}
