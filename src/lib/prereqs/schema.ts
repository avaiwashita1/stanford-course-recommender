// The structured form of a course's prerequisites.
//
// Rules are stored as "all of these groups; each group is satisfied by any one of its options"
// (AND of ORs). For example "CS 106B; CS 103; CS 109 or STATS 116" becomes
//   groups: [[CS 106B], [CS 103], [CS 109, STATS 116]]
// Options are either a course code or a non-course condition ("consent of instructor",
// "equivalent background") that software can't verify.
import { z } from "zod";

// What the AI returns: courses or free-text conditions.
const AiOptionSchema = z.object({
  kind: z.enum(["course", "other"]),
  /** "CS 106B" for courses; a short description for other conditions. */
  value: z.string(),
});

// What we store after deterministic clean-up (normalize.ts) adds "family":
// a code like "PWR 1" that isn't a course itself but covers PWR 1LS, PWR 1AB, ...
export const PrereqOptionSchema = z.object({
  kind: z.enum(["course", "family", "other"]),
  value: z.string(),
});

const ruleFields = {
  /** Recommended / suggested preparation. Shown to students but never enforced. */
  recommended: z.array(z.string()),
  /** Corequisites (may be taken at the same time). Shown but not enforced. */
  corequisites: z.array(z.string()),
  /** "low" when the text was ambiguous; such courses are shown as unverified. */
  confidence: z.enum(["high", "low"]),
};

export const AiPrereqRuleSchema = z.object({
  groups: z.array(z.object({ anyOf: z.array(AiOptionSchema) })),
  ...ruleFields,
});

export const PrereqRuleSchema = z.object({
  /** All groups must be satisfied. Empty = no hard prerequisites. */
  groups: z.array(z.object({ anyOf: z.array(PrereqOptionSchema) })),
  ...ruleFields,
});

export type AiPrereqRule = z.infer<typeof AiPrereqRuleSchema>;

export type PrereqOption = z.infer<typeof PrereqOptionSchema>;
export type PrereqRule = z.infer<typeof PrereqRuleSchema>;

/** Cache entry (prereqs/rules.json): the AI's raw output and the exact text it read. */
export interface CachedAiRule {
  courseId: string;
  sourceText: string;
  ai: AiPrereqRule;
}

/** A cleaned-up rule plus the exact text it was parsed from (to detect stale rules). */
export interface StoredPrereqRule {
  courseId: string;
  sourceText: string;
  rule: PrereqRule;
}
