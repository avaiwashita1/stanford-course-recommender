import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-gray-700">
        Start by adding the courses you&apos;ve taken. Personalized recommendations are coming next; for now you
        can also browse this year&apos;s catalog.
      </p>
      <div className="flex gap-3">
      <Link
        href="/my-courses"
        className="inline-block rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010]"
      >
        Add my courses
      </Link>
      <Link
        href="/courses"
        className="inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-50"
      >
        Search courses
      </Link>
      </div>
    </div>
  );
}
