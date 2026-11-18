"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Hint Google to show Stanford accounts first. The real check happens on the server.
        queryParams: { hd: "stanford.edu", prompt: "select_account" },
      },
    });
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="w-full rounded-lg bg-[#8C1515] px-4 py-3 font-medium text-white hover:bg-[#6f1010] disabled:opacity-60"
    >
      {loading ? "Redirecting to Google…" : "Sign in with Google"}
    </button>
  );
}
