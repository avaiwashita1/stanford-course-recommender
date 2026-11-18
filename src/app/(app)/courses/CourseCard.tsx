import { formatUnits, scheduleSummary } from "@/lib/catalog/format";
import type { Course } from "@/lib/catalog/types";

export function CourseCard({ course }: { course: Course }) {
  const schedule = scheduleSummary(course);
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

      <ul className="space-y-0.5 text-sm text-gray-700">
        {schedule.map((s) => (
          <li key={s.term}>
            <span className="inline-block w-16 font-medium">{s.term}</span>
            {s.lines.join(" · ")}
            {s.instructors.length > 0 && <span className="text-gray-500"> — {s.instructors.join(", ")}</span>}
          </li>
        ))}
      </ul>

      {course.prereqText && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Prerequisites:</span> {course.prereqText.replace(/^pre-?requisites?:?\s*/i, "")}
        </p>
      )}

      <details className="text-sm text-gray-700">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-800">Description</summary>
        <p className="mt-1">{course.description || "No description provided."}</p>
        {course.gers.length > 0 && <p className="mt-1 text-gray-500">{course.gers.join(", ")}</p>}
      </details>
    </article>
  );
}
