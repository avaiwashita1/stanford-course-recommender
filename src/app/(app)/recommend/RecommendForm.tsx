"use client";

import { useActionState } from "react";
import { DAYS, TERMS } from "@/lib/catalog/types";
import { CourseCard } from "../courses/CourseCard";
import { getRecommendations, type RecommendState } from "./actions";

const WEEKDAYS = DAYS.slice(0, 5);
const UNIT_OPTIONS = [1, 2, 3, 4, 5];

export function RecommendForm({ hasCourses }: { hasCourses: boolean }) {
  const [state, action, pending] = useActionState<RecommendState, FormData>(getRecommendations, { status: "idle" });
  const form = state.status === "idle" ? { interests: "", terms: [], days: [], min: "", max: "" } : state.form;

  return (
    <div className="space-y-5">
      {/* Re-mount the form with each result so every field shows what was submitted. */}
      <form key={JSON.stringify(form)} action={action} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="block space-y-1">
          <span className="font-medium text-gray-800">What are you interested in?</span>
          <textarea
            name="interests"
            defaultValue={form.interests}
            rows={4}
            maxLength={1000}
            required
            placeholder="e.g. I love machine learning applied to health and biology, and I'd like something hands-on with a final project. Not too theory-heavy."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#8C1515] focus:outline-none"
          />
        </label>

        <div className="grid gap-4 text-sm sm:grid-cols-3">
          <fieldset>
            <legend className="mb-1 font-medium text-gray-700">Quarter</legend>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {TERMS.map((t) => (
                <label key={t} className="flex items-center gap-1">
                  <input type="checkbox" name="term" value={t} defaultChecked={form.terms.includes(t)} />
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
                  <input type="checkbox" name="days" value={d} defaultChecked={form.days.includes(d)} />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 font-medium text-gray-700">Units</legend>
            <div className="flex items-center gap-2">
              <select name="min" defaultValue={form.min} className="rounded border border-gray-300 px-2 py-1">
                <option value="">Any</option>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <span>to</span>
              <select name="max" defaultValue={form.max} className="rounded border border-gray-300 px-2 py-1">
                <option value="">Any</option>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010] disabled:opacity-60"
          >
            {pending ? "Finding courses… (about 15 seconds)" : "Get recommendations"}
          </button>
          <p className="text-xs text-gray-500">
            Only your interests text and public catalog data are sent to the AI — never your course list.
          </p>
        </div>
      </form>

      {state.status === "error" && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>}

      {state.status === "done" && !pending && (
        <section className="space-y-3">
          {state.result.recommendations.length === 0 ? (
            <p className="text-gray-700">
              No good matches{state.result.candidateCount === 0 ? " among courses you can take with these filters" : ""}. Try
              describing your interests differently or loosening the filters.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Top {state.result.recommendations.length} of {state.result.candidateCount} eligible courses that matched
              {" "}
              <span className="italic">{state.result.keywords.join(", ")}</span>.
              {!hasCourses && " Add your courses on My courses for eligibility checks."}
            </p>
          )}
          {state.result.recommendations.map((r) => (
            <CourseCard key={r.course.id} annotated={r} showEligibility={hasCourses} reason={r.reason} />
          ))}
        </section>
      )}
    </div>
  );
}
