import { formatUnits, scheduleSummary } from "@/lib/catalog/format";
import type { AnnotatedCourse } from "@/lib/prereqs/annotate";
import { AddToPlan } from "../plan/AddToPlan";

const BADGES = {
  taken: { label: "Already taken", className: "bg-gray-100 text-gray-700" },
  eligible: { label: "✓ Eligible", className: "bg-green-100 text-green-800" },
  no_prereqs: { label: "✓ No prerequisites", className: "bg-green-100 text-green-800" },
  unverified: { label: "? Check prerequisites", className: "bg-amber-100 text-amber-900" },
  missing: { label: "✗ Missing prerequisites", className: "bg-red-100 text-red-800" },
} as const;

export function CourseCard({
  annotated,
  showEligibility,
  reason,
}: {
  annotated: AnnotatedCourse;
  showEligibility: boolean;
  /** AI explanation of why this course matches the student's interests. */
  reason?: string;
}) {
  const { course } = annotated;
  const schedule = scheduleSummary(course);
  const badge = annotated.alreadyTaken ? BADGES.taken : BADGES[annotated.eligibility];

  return (
    <article className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">
          <span className="text-[#8C1515]">{course.id}</span> · {course.title}
        </h2>
        <span className="text-sm text-gray-600">{formatUnits(course)}</span>
      </div>

      {course.crossListings.length > 0 && (
        <p className="text-xs text-gray-500">Also listed as {course.crossListings.join(", ")}</p>
      )}

      {reason && (
        <p className="rounded-md bg-[#8C1515]/5 px-3 py-2 text-sm text-gray-800">
          <span className="font-medium text-[#8C1515]">Why it fits: </span>
          {reason}
        </p>
      )}

      {showEligibility && (
        <p className="text-sm">
          <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
          {!annotated.alreadyTaken && annotated.eligibility !== "no_prereqs" && (
            <span className="text-gray-700">{annotated.explanation}</span>
          )}
        </p>
      )}

      <ul className="space-y-0.5 text-sm text-gray-700">
        {schedule.map((s) => (
          <li key={s.term}>
            <span className="inline-block w-16 font-medium">{s.term}</span>
            {s.lines.join(" · ")}
            {s.instructors.length > 0 && <span className="text-gray-500"> — {s.instructors.join(", ")}</span>}
          </li>
        ))}
      </ul>

      {annotated.conflictTerms.length > 0 && !annotated.plannedTerm && (
        <p className="text-xs text-amber-800">
          Every section clashes with your plan in {annotated.conflictTerms.join(", ")}.
        </p>
      )}

      {!annotated.alreadyTaken && (
        <AddToPlan courseId={course.id} options={annotated.options} plannedTerm={annotated.plannedTerm} />
      )}

      <details className="text-sm text-gray-700">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-800">Description & prerequisites</summary>
        <p className="mt-1">{course.description || "No description provided."}</p>
        {course.prereqText && (
          <p className="mt-1 text-gray-600">
            <span className="font-medium">Catalog prerequisites:</span> {course.prereqText.replace(/^pre-?requisites?:?\s*/i, "")}
          </p>
        )}
        {annotated.recommended.length > 0 && (
          <p className="mt-1 text-gray-600">
            <span className="font-medium">Recommended (not required):</span> {annotated.recommended.join("; ")}
          </p>
        )}
        {course.gers.length > 0 && <p className="mt-1 text-gray-500">{course.gers.join(", ")}</p>}
      </details>
    </article>
  );
}
