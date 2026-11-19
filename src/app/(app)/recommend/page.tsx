import Link from "next/link";
import { getMyCourses } from "@/lib/transcript/repository";
import { RecommendForm } from "./RecommendForm";

export default async function RecommendPage() {
  const myCourses = await getMyCourses();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Recommendations</h1>
        <p className="text-gray-600">
          Describe what you&apos;d like to learn. We only suggest courses you haven&apos;t taken and whose prerequisites you
          meet (or that need a quick check).
        </p>
      </div>
      {myCourses.length === 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          You haven&apos;t added any courses yet, so recommendations can&apos;t check prerequisites.{" "}
          <Link href="/my-courses" className="underline">Add your courses first</Link>.
        </p>
      )}
      <RecommendForm hasCourses={myCourses.length > 0} />
    </div>
  );
}
