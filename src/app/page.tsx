import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-xl font-semibold">Course Recommender</h1>
        <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{email}</span>
          <button className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </header>
      <section className="py-10 text-gray-700">
        <p>You&apos;re signed in. Course search, transcript upload and recommendations are coming next.</p>
      </section>
    </main>
  );
}
