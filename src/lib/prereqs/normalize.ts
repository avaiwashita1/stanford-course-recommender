// Deterministic clean-up of AI-parsed rules. The AI reads the text; this code makes the
// result safe to enforce:
//  - normalizes course codes; anything that isn't a valid code becomes an "other" condition
//  - adds cross-listed equivalents (CS 229 also accepts STATS 229)
//  - turns codes like "PWR 1" (not a course, but PWR 1LS, PWR 1AB, ... exist) into a "family"
//  - when NONE of a group's courses is offered this year (e.g. only a renumbered course is
//    listed), adds an "equivalent" option so the course is shown as unverified, not hidden
//  - drops groups that list a corequisite (those may be taken at the same time)
import { normalizeCourseCode } from "@/lib/catalog/code";
import type { AiPrereqRule, PrereqOption, PrereqRule } from "./schema";

export interface CatalogIndex {
  ids: ReadonlySet<string>;
  crossListings: ReadonlyMap<string, readonly string[]>;
}

export function familyPattern(code: string): RegExp {
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}[A-Z]+$`);
}

export function normalizeRule(rule: AiPrereqRule, catalog: CatalogIndex): PrereqRule {
  const coreqs = new Set(rule.corequisites.map((c) => normalizeCourseCode(c)).filter(Boolean));
  const allIds = [...catalog.ids];

  const groups = rule.groups
    .filter((g) => !g.anyOf.some((o) => o.kind === "course" && coreqs.has(normalizeCourseCode(o.value))))
    .map((g) => {
      const seen = new Set<string>();
      const options: PrereqOption[] = [];
      const notOffered: string[] = [];
      const add = (o: PrereqOption) => {
        const key = `${o.kind}:${o.value.toLowerCase()}`;
        if (!o.value.trim() || seen.has(key)) return;
        seen.add(key);
        options.push(o);
      };
      for (const o of g.anyOf) {
        // An "other" option that is exactly a course code (e.g. "PWR1") is treated as a course.
        const code = normalizeCourseCode(o.value);
        if (!code) {
          add({ kind: "other", value: o.value.trim() });
        } else if (catalog.ids.has(code)) {
          add({ kind: "course", value: code });
          for (const alt of catalog.crossListings.get(code) ?? []) add({ kind: "course", value: alt });
        } else if (allIds.some((id) => familyPattern(code).test(id))) {
          add({ kind: "family", value: code });
        } else {
          add({ kind: "course", value: code });
          notOffered.push(code);
        }
      }
      // Only if no alternative in this group can be taken/verified today.
      const hasCurrentAlternative = options.some((o) => (o.kind === "course" && catalog.ids.has(o.value)) || o.kind === "family");
      if (notOffered.length && !hasCurrentAlternative) {
        add({ kind: "other", value: `equivalent (${notOffered.join(", ")} not offered this year)` });
      }
      return { anyOf: options };
    })
    .filter((g) => g.anyOf.length > 0);

  return { ...rule, groups };
}
