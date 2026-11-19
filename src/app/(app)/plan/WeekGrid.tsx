// A small Mon–Fri calendar for one quarter's planned courses.
import { toMinutes } from "@/lib/catalog/time";
import type { Day } from "@/lib/catalog/types";
import type { PlannedEntry } from "@/lib/plan/types";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const COLORS = ["bg-red-100 border-red-300", "bg-blue-100 border-blue-300", "bg-green-100 border-green-300", "bg-amber-100 border-amber-300", "bg-purple-100 border-purple-300", "bg-teal-100 border-teal-300"];

export function WeekGrid({ entries }: { entries: PlannedEntry[] }) {
  const blocks = entries.flatMap((e, i) =>
    e.meetings.flatMap((m) =>
      m.start && m.end ? m.days.filter((d) => DAYS.includes(d)).map((d) => ({ e, d, start: toMinutes(m.start!), end: toMinutes(m.end!), color: COLORS[i % COLORS.length] })) : [],
    ),
  );
  if (blocks.length === 0) return null;
  const first = Math.min(8 * 60, ...blocks.map((b) => Math.floor(b.start / 60) * 60));
  const last = Math.max(17 * 60, ...blocks.map((b) => Math.ceil(b.end / 60) * 60));
  const PX = 0.8; // pixels per minute
  const hours = Array.from({ length: (last - first) / 60 + 1 }, (_, i) => first + i * 60);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[480px] grid-cols-[40px_repeat(5,1fr)] text-xs">
        <div />
        {DAYS.map((d) => <div key={d} className="pb-1 text-center font-medium text-gray-600">{d}</div>)}
        <div className="relative" style={{ height: (last - first) * PX }}>
          {hours.map((h) => (
            <span key={h} className="absolute -translate-y-1/2 text-gray-400" style={{ top: (h - first) * PX }}>
              {((h / 60 + 11) % 12) + 1}{h / 60 < 12 ? "a" : "p"}
            </span>
          ))}
        </div>
        {DAYS.map((d) => (
          <div key={d} className="relative border-l border-gray-100" style={{ height: (last - first) * PX }}>
            {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-gray-100" style={{ top: (h - first) * PX }} />)}
            {blocks.filter((b) => b.d === d).map((b, i) => (
              <div
                key={i}
                className={`absolute inset-x-0.5 overflow-hidden rounded border px-1 leading-tight ${b.color}`}
                style={{ top: (b.start - first) * PX, height: Math.max((b.end - b.start) * PX, 14) }}
                title={`${b.e.courseId} ${b.e.title}`}
              >
                {b.e.courseId}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
