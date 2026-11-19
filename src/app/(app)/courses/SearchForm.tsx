// A plain GET form: submitting it updates the URL (?q=...&days=...), which the page reads.
// No client JavaScript needed, and searches are shareable/bookmarkable.
import { DAYS, TERMS } from "@/lib/catalog/types";
import type { CourseSearch } from "@/lib/catalog/search-params";

const WEEKDAYS = DAYS.slice(0, 5);
const UNIT_OPTIONS = [1, 2, 3, 4, 5];

export function SearchForm({ search }: { search: CourseSearch }) {
  return (
    <form method="get" className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <input
          name="q"
          defaultValue={search.q}
          placeholder="Search by topic, title or code (e.g. machine learning, CS 161, PSYCH)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-[#8C1515] focus:outline-none"
        />
        <button className="rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010]">
          Search
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="canTake" value="1" defaultChecked={search.canTakeOnly} />
        Only courses I can take (hide ones I&apos;ve taken or planned, am missing prerequisites for, or that clash with my plan)
      </label>

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <fieldset>
          <legend className="mb-1 font-medium text-gray-700">Quarter</legend>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {TERMS.map((t) => (
              <label key={t} className="flex items-center gap-1">
                <input type="checkbox" name="term" value={t} defaultChecked={search.terms?.includes(t)} />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-medium text-gray-700">Meets only on</legend>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {WEEKDAYS.map((d) => (
              <label key={d} className="flex items-center gap-1">
                <input type="checkbox" name="days" value={d} defaultChecked={search.days?.includes(d)} />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 font-medium text-gray-700">Units</legend>
          <div className="flex items-center gap-2">
            <select name="min" defaultValue={search.minUnits ?? ""} className="rounded border border-gray-300 px-2 py-1">
              <option value="">Any</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <span>to</span>
            <select name="max" defaultValue={search.maxUnits ?? ""} className="rounded border border-gray-300 px-2 py-1">
              <option value="">Any</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </fieldset>
      </div>
    </form>
  );
}
