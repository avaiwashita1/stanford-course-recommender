"use client";

import { useState, useTransition } from "react";
import type { TermOption } from "@/lib/prereqs/annotate";
import { addToPlan, removeFromPlan } from "./actions";

export function AddToPlan({
  courseId,
  options,
  plannedTerm,
}: {
  courseId: string;
  options: TermOption[];
  plannedTerm: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const r = await fn();
      setMessage({ ok: r.ok, text: r.message });
      if (r.ok) setOpen(false);
    });

  if (plannedTerm) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">In your plan · {plannedTerm}</span>
        <button disabled={pending} onClick={() => run(() => removeFromPlan(courseId))} className="text-xs text-gray-500 hover:text-red-700">
          Remove
        </button>
        <button onClick={() => setOpen((o) => !o)} className="text-xs text-gray-500 hover:text-gray-800">
          Change section
        </button>
        {open && <Options />}
        {message && !message.ok && <span className="text-xs text-red-700">{message.text}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium hover:border-[#8C1515] hover:text-[#8C1515]"
      >
        {open ? "Cancel" : "+ Add to plan"}
      </button>
      {open && <Options />}
      {message && <p className={`text-xs ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );

  function Options() {
    if (options.length === 0) return <p className="text-xs text-gray-500">Not offered in the selected quarters.</p>;
    return (
      <div className="w-full space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        {options.map((t) => (
          <div key={t.term}>
            <p className="text-xs font-medium text-gray-700">
              {t.term}
              {t.eligibility === "missing" && <span className="ml-2 text-red-700">missing prerequisites this quarter</span>}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {t.sections.map((s) => {
                const clash = s.conflictsWith.length > 0;
                return (
                  <button
                    key={`${t.term}-${s.classId}`}
                    disabled={pending || clash}
                    onClick={() => run(() => addToPlan(courseId, t.term, s.classId))}
                    title={clash ? `Conflicts with ${s.conflictsWith.join(", ")}` : "Add this section"}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-left text-xs hover:border-[#8C1515] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {s.label && <span className="font-medium">{s.label} · </span>}
                    {s.schedule}
                    {clash && <span className="text-red-700"> · conflicts with {s.conflictsWith.join(", ")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
