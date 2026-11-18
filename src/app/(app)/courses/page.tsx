import { searchCourses } from "@/lib/catalog/repository";
import { hasAnyCriteria, parseCourseSearch } from "@/lib/catalog/search-params";
import { CourseCard } from "./CourseCard";
import { SearchForm } from "./SearchForm";

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const search = parseCourseSearch(await searchParams);
  const result = hasAnyCriteria(search) ? await searchCourses(search) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Search courses</h1>
      <SearchForm search={search} />

      {!result && <p className="text-gray-600">Enter a topic or course code, or pick filters, to see courses.</p>}

      {result && (
        <>
          <p className="text-sm text-gray-600">
            {result.total === 0
              ? "No courses match. Try fewer filters."
              : `Showing ${result.courses.length} of ${result.total}${result.capped ? "+" : ""} matching courses.`}
            {search.days?.length ? " Courses whose meeting days aren't announced yet are hidden by the day filter." : ""}
          </p>
          <div className="space-y-3">
            {result.courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
