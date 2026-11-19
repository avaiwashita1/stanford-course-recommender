import { searchCourses } from "@/lib/catalog/repository";
import { hasAnyCriteria, parseCourseSearch } from "@/lib/catalog/search-params";
import { annotateCourses, canTake } from "@/lib/prereqs/annotate";
import { getPrereqRules } from "@/lib/prereqs/repository";
import { getStudentContext } from "@/lib/plan/repository";
import Link from "next/link";
import { CourseCard } from "./CourseCard";
import { SearchForm } from "./SearchForm";

const PAGE_SIZE = 50;

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const search = parseCourseSearch(await searchParams);
  const show = hasAnyCriteria(search);

  const [result, student] = await Promise.all([show ? searchCourses(search) : null, getStudentContext()]);
  const completed = student.completed;

  let annotated = result
    ? annotateCourses(result.courses, await getPrereqRules(result.courses.map((c) => c.id)), student, {
        terms: search.terms,
        days: search.days,
      })
    : [];
  if (search.canTakeOnly) annotated = annotated.filter(canTake);
  const total = annotated.length;
  const visible = annotated.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Search courses</h1>
      <SearchForm search={search} />

      {completed.size === 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Add your completed courses on <Link href="/my-courses" className="underline">My courses</Link> to see which
          classes you&apos;re eligible for.
        </p>
      )}

      {!show && <p className="text-gray-600">Enter a topic or course code, or pick filters, to see courses.</p>}

      {result && (
        <>
          <p className="text-sm text-gray-600">
            {total === 0
              ? "No courses match. Try fewer filters."
              : `Showing ${visible.length} of ${total}${result.capped ? "+" : ""} matching courses.`}
            {search.days?.length ? " Courses whose meeting days aren't announced yet are hidden by the day filter." : ""}
          </p>
          <div className="space-y-3">
            {visible.map((a) => (
              <CourseCard key={a.course.id} annotated={a} showEligibility={completed.size > 0} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
