import Link from "next/link";

const STEPS = [
  { href: "/my-courses", title: "1. Add your courses", body: "Upload your unofficial transcript (read on your device) or add courses by hand." },
  { href: "/recommend", title: "2. Get recommendations", body: "Describe your interests and get courses you're eligible for, with reasons." },
  { href: "/courses", title: "Or browse the catalog", body: "Search this year's courses with quarter, day and unit filters." },
];

export default function Home() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#8C1515]">
            <h2 className="font-semibold text-[#8C1515]">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{s.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
