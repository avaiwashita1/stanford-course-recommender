import { getMyCourses } from "@/lib/transcript/repository";
import { MyCoursesEditor } from "./MyCoursesEditor";

export default async function MyCoursesPage() {
  const courses = await getMyCourses();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My courses</h1>
        <p className="text-gray-600">
          Courses you&apos;ve completed or are taking now. Recommendations skip these and use them to check prerequisites.
        </p>
      </div>
      <MyCoursesEditor initial={courses} />
    </div>
  );
}
