"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth/allowed-email";

export type MagicLinkState = { status: "idle" | "sent" | "error"; message?: string };

// Sends a one-time sign-in link to the student's email.
// We check the domain *before* sending so we never email non-Stanford addresses.
export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const domain = process.env.ALLOWED_EMAIL_DOMAIN;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  if (!isAllowedEmail(email, domain)) {
    return { status: "error", message: `Please use your @${domain} email address.` };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    // Supabase's free email service is rate limited; give a helpful message.
    const rateLimited = error.status === 429 || /rate limit/i.test(error.message);
    return {
      status: "error",
      message: rateLimited
        ? "Too many sign-in emails were sent recently. Please wait a few minutes and try again."
        : "Couldn't send the sign-in email. Please try again.",
    };
  }

  return {
    status: "sent",
    message: `Check ${email} for a sign-in link. Open it in this same browser.`,
  };
}
