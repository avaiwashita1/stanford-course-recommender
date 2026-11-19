"use client";

import { useTransition } from "react";
import { removeFromPlan } from "./actions";

export function RemoveButton({ courseId }: { courseId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => void (await removeFromPlan(courseId)))}
      className="text-gray-400 hover:text-red-700"
      aria-label={`Remove ${courseId}`}
    >
      {pending ? "…" : "✕"}
    </button>
  );
}
