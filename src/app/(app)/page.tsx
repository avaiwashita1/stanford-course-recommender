import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-gray-700">
        Transcript upload and personalized recommendations are coming in the next steps. For now you can
        browse this year&apos;s catalog.
      </p>
      <Link
        href="/courses"
        className="inline-block rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010]"
      >
        Search courses
      </Link>
    </div>
  );
}
