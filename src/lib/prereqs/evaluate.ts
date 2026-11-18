// Deterministic prerequisite checking. No AI here: given a parsed rule and the
// courses a student has (or will have) completed, decide eligibility and explain why.
import { familyPattern } from "./normalize";
import type { PrereqOption, PrereqRule } from "./schema";

export type Eligibility =
  | "eligible" // every requirement met by courses on record
  | "no_prereqs" // the course has no hard prerequisites
  | "unverified" // nothing is definitely missing, but something can't be checked (e.g. consent of instructor)
  | "missing"; // at least one requirement is definitely not met

export interface GroupResult {
  status: "met" | "unverified" | "missing";
  options: PrereqOption[];
  /** The completed course that satisfied this group, if any. */
  metBy?: string;
}

export interface EligibilityResult {
  status: Eligibility;
  groups: GroupResult[];
  /** Extra reasons the result is unverified (stale or low-confidence parse). */
  notes: string[];
}

export interface CourseForEligibility {
  prereqText: string | null;
}

/**
 * @param course       the course being checked (only its raw prerequisite text is used)
 * @param stored       the parsed rule and the text it came from, or null if not parsed
 * @param completed    course codes the student has completed or will have completed
 * @param equivalents  optional map: course code -> other codes for the same class (cross-listings)
 */
export function checkEligibility(
  course: CourseForEligibility,
  stored: { sourceText: string; rule: PrereqRule } | null,
  completed: ReadonlySet<string>,
  equivalents: ReadonlyMap<string, readonly string[]> = new Map(),
): EligibilityResult {
  if (!course.prereqText) return { status: "no_prereqs", groups: [], notes: [] };
  if (!stored) {
    return { status: "unverified", groups: [], notes: ["Prerequisites haven't been checked yet."] };
  }

  const notes: string[] = [];
  if (stored.sourceText !== course.prereqText) {
    notes.push("The catalog's prerequisite text changed since it was last checked.");
  }
  if (stored.rule.confidence === "low") {
    notes.push("The prerequisite description is ambiguous; please double-check it.");
  }

  const has = (code: string): string | undefined => {
    if (completed.has(code)) return code;
    return equivalents.get(code)?.find((alt) => completed.has(alt));
  };

  const groups: GroupResult[] = stored.rule.groups.map((g) => {
    for (const opt of g.anyOf) {
      if (opt.kind === "course") {
        const metBy = has(opt.value);
        if (metBy) return { status: "met", options: g.anyOf, metBy };
      } else if (opt.kind === "family") {
        // e.g. "PWR 1" is met by PWR 1LS
        const pattern = familyPattern(opt.value);
        const metBy = [...completed].find((c) => c === opt.value || pattern.test(c));
        if (metBy) return { status: "met", options: g.anyOf, metBy };
      }
    }
    const canBeOther = g.anyOf.some((o) => o.kind === "other");
    return { status: canBeOther ? "unverified" : "missing", options: g.anyOf };
  });

  // Only hide a course ("missing") when we trust the rule. If the rule is stale or
  // ambiguous, show the course as unverified instead.
  const trusted = notes.length === 0;
  let status: Eligibility;
  if (groups.some((g) => g.status === "missing")) status = trusted ? "missing" : "unverified";
  else if (groups.some((g) => g.status === "unverified") || notes.length) status = "unverified";
  else status = groups.length ? "eligible" : "no_prereqs";

  return { status, groups, notes };
}

/** Human-readable one-line explanation, e.g. "You've taken CS 107 and CS 161." */
export function explainEligibility(r: EligibilityResult): string {
  const met = r.groups.filter((g) => g.status === "met").map((g) => g.metBy!);
  const join = (xs: string[]) =>
    xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
  const describe = (g: GroupResult) => g.options.map((o) => o.value).join(" or ");

  switch (r.status) {
    case "no_prereqs":
      return "No prerequisites.";
    case "eligible":
      return `You've taken ${join(met)}.`;
    case "missing": {
      const missing = r.groups.filter((g) => g.status === "missing").map(describe);
      return `Missing: ${missing.join("; ")}.`;
    }
    case "unverified": {
      const parts: string[] = [];
      if (met.length) parts.push(`You've taken ${join(met)}.`);
      const unverified = r.groups.filter((g) => g.status === "unverified").map(describe);
      if (unverified.length) parts.push(`Can't verify: ${unverified.join("; ")}.`);
      const missing = r.groups.filter((g) => g.status === "missing").map(describe);
      if (missing.length) parts.push(`Possibly missing: ${missing.join("; ")}.`);
      parts.push(...r.notes);
      return parts.join(" ");
    }
  }
}
