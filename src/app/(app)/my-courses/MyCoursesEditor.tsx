"use client";

import { useMemo, useState, useTransition } from "react";
import { normalizeCourseCode } from "@/lib/catalog/code";
import { mergeTranscript } from "@/lib/transcript/merge";
import { COUNTED_STATUSES, type TranscriptCourse } from "@/lib/transcript/parse";
import { saveMyCourses } from "./actions";

const TERM_ORDER = ["Autumn", "Winter", "Spring", "Summer"];
function termSortKey(term: string | null): string {
  if (!term) return "9999";
  const [years, quarter] = term.split(" ");
  return `${years}-${TERM_ORDER.indexOf(quarter)}`;
}

export function MyCoursesEditor({ initial }: { initial: TranscriptCourse[] }) {
  const [courses, setCourses] = useState<TranscriptCourse[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [manual, setManual] = useState("");
  const [saving, startSaving] = useTransition();

  const counted = courses.filter((c) => COUNTED_STATUSES.includes(c.status));
  const notCounted = courses.filter((c) => !COUNTED_STATUSES.includes(c.status));

  const groups = useMemo(() => {
    const map = new Map<string, TranscriptCourse[]>();
    for (const c of counted) {
      const key = c.term ?? "Added manually";
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()].sort(([a], [b]) =>
      termSortKey(a === "Added manually" ? null : a).localeCompare(termSortKey(b === "Added manually" ? null : b)),
    );
  }, [counted]);

  function update(next: TranscriptCourse[]) {
    setCourses(next);
    setDirty(true);
    setNotice(null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReading(true);
    setNotice(null);
    try {
      const { readTranscriptPdf } = await import("@/lib/transcript/read-pdf");
      const parsed = await readTranscriptPdf(file);
      if (parsed.length === 0) {
        setNotice({
          ok: false,
          text: "No courses found. Make sure it's the Axess unofficial transcript PDF, or add courses manually below.",
        });
        return;
      }
      update(mergeTranscript(courses, parsed));
      setNotice({ ok: true, text: `Found ${parsed.length} courses. Review the list, then click Save.` });
    } catch (err) {
      console.error(err);
      setNotice({ ok: false, text: "Couldn't read that PDF. You can add courses manually below." });
    } finally {
      setReading(false);
    }
  }

  function addManual(e: React.FormEvent) {
    e.preventDefault();
    const id = normalizeCourseCode(manual);
    if (!id) {
      setNotice({ ok: false, text: `"${manual}" doesn't look like a course code (e.g. CS 106B).` });
      return;
    }
    const others = courses.filter((c) => c.courseId !== id);
    update([...others, { courseId: id, title: "", term: null, status: "completed", source: "manual" }]);
    setManual("");
  }

  function remove(id: string) {
    update(courses.filter((c) => c.courseId !== id));
  }

  function countAnyway(id: string) {
    update(courses.map((c) => (c.courseId === id ? { ...c, status: "completed" } : c)));
  }

  function save() {
    startSaving(async () => {
      const result = await saveMyCourses(courses);
      setNotice({ ok: result.ok, text: result.message });
      if (result.ok) {
        setDirty(false);
        setCourses((cs) => cs.filter((c) => COUNTED_STATUSES.includes(c.status)));
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010]">
            {reading ? "Reading…" : "Upload unofficial transcript (PDF)"}
            <input type="file" accept="application/pdf" className="sr-only" onChange={onFile} disabled={reading} />
          </label>
          <form onSubmit={addManual} className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Add a course, e.g. CS 106B"
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8C1515] focus:outline-none"
            />
            <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Add</button>
          </form>
        </div>
        <p className="text-xs text-gray-500">
          🔒 Your PDF is read on this device and never uploaded. We save only course codes, titles and quarters — no
          grades, name or student ID. Get the PDF from Axess → My Academics → Unofficial Transcript.
        </p>
        {notice && (
          <p className={`rounded-md p-2 text-sm ${notice.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
            {notice.text}
          </p>
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          {counted.length} course{counted.length === 1 ? "" : "s"} counted toward prerequisites
        </h2>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-lg bg-[#8C1515] px-4 py-2 font-medium text-white hover:bg-[#6f1010] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
      </div>

      {counted.length === 0 && (
        <p className="text-gray-600">No courses yet. Upload your transcript or add courses manually.</p>
      )}

      {groups.map(([term, list]) => (
        <section key={term} className="rounded-xl border border-gray-200 bg-white">
          <h3 className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-600">{term}</h3>
          <ul className="divide-y divide-gray-100">
            {list.map((c) => (
              <li key={c.courseId} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span>
                  <span className="font-medium text-[#8C1515]">{c.courseId}</span>
                  {c.title && <span className="text-gray-700"> · {c.title}</span>}
                  {c.status === "in_progress" && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">in progress</span>
                  )}
                </span>
                <button
                  onClick={() => remove(c.courseId)}
                  className="text-gray-400 hover:text-red-700"
                  aria-label={`Remove ${c.courseId}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {notCounted.length > 0 && (
        <details className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
          <summary className="cursor-pointer text-gray-600">
            {notCounted.length} not counted (withdrawn or not passed)
          </summary>
          <ul className="mt-2 divide-y divide-gray-100">
            {notCounted.map((c) => (
              <li key={c.courseId} className="flex items-center justify-between py-2">
                <span className="text-gray-500">
                  {c.courseId} · {c.title} <span className="text-xs">({c.status.replace("_", " ")}, {c.term})</span>
                </span>
                <button onClick={() => countAnyway(c.courseId)} className="text-xs text-[#8C1515] hover:underline">
                  Count it anyway
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
