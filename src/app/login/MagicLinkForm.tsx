"use client";

import { useActionState } from "react";
import { sendMagicLink, type MagicLinkState } from "./actions";

const initial: MagicLinkState = { status: "idle" };

export function MagicLinkForm() {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  if (state.status === "sent") {
    return <p className="rounded-md bg-green-50 p-3 text-sm text-green-800">{state.message}</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700" htmlFor="email">
        Stanford email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="sunetid@stanford.edu"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#8C1515] focus:outline-none"
      />
      {state.status === "error" && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8C1515] px-4 py-3 font-medium text-white hover:bg-[#6f1010] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
