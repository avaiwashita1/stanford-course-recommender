import Link from "next/link";
import { formatMeeting } from "@/lib/catalog/format";
import { TERMS } from "@/lib/catalog/types";
import { planConflicts } from "@/lib/plan/conflicts";
import { getMyPlan } from "@/lib/plan/repository";
import { RemoveButton } from "./RemoveButton";
import { WeekGrid } from "./WeekGrid";

const MAX_UNITS = 20; // Stanford's usual per-quarter maximum without petition

export default async function PlanPage() {
  const plan = await getMyPlan();
  const conflicts = planConflicts(plan);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My plan · 2026–27</h1>
        <p className="text-gray-600">
          Courses you plan to take. Recommendations and search skip courses that clash with these, and courses planned in
          earlier quarters count toward prerequisites for later ones.
        </p>
      </div>

      {plan.length === 0 && (
        <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-700">
          Nothing planned yet. Use <span className="font-medium">+ Add to plan</span> on{" "}
          <Link href="/recommend" className="underline">Recommendations</Link> or{" "}
          <Link href="/courses" className="underline">Search courses</Link>.
        </p>
      )}

      {conflicts.length > 0 && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Time conflicts (the catalog may have changed): {conflicts.map(([a, b]) => `${a} ↔ ${b}`).join("; ")}.
        </p>
      )}

      {TERMS.map((term) => {
        const entries = plan.filter((p) => p.term === term);
        if (entries.length === 0) return null;
        const min = entries.reduce((s, e) => s + e.unitsMin, 0);
        const max = entries.reduce((s, e) => s + e.unitsMax, 0);
        return (
          <section key={term} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">{term}</h2>
              <span className={`text-sm ${min > MAX_UNITS ? "text-red-700" : "text-gray-600"}`}>
                {min === max ? min : `${min}–${max}`} units{min > MAX_UNITS ? ` (over ${MAX_UNITS})` : ""}
              </span>
            </div>
            <ul className="divide-y divide-gray-100 text-sm">
              {entries.map((e) => (
                <li key={e.courseId} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-medium text-[#8C1515]">{e.courseId}</span> · {e.title}
                    <span className="block text-xs text-gray-500">
                      {e.sectionLabel ? `${e.sectionLabel} · ` : ""}
                      {e.meetings.length ? e.meetings.map(formatMeeting).join(", ") : "Time TBA"} ·{" "}
                      {e.unitsMin === e.unitsMax ? e.unitsMin : `${e.unitsMin}–${e.unitsMax}`} units
                    </span>
                  </span>
                  <RemoveButton courseId={e.courseId} />
                </li>
              ))}
            </ul>
            <WeekGrid entries={entries} />
          </section>
        );
      })}
    </div>
  );
}
