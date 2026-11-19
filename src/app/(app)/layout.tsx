// Shared layout for every signed-in page: top navigation bar.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/" className="font-semibold text-[#8C1515]">
              Course Recommender
            </Link>
            <Link href="/recommend" className="text-gray-700 hover:text-black">
              Recommendations
            </Link>
            <Link href="/my-courses" className="text-gray-700 hover:text-black">
              My courses
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-black">
              Search courses
            </Link>
          </nav>
          <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-500 sm:inline">{email}</span>
            <button className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
