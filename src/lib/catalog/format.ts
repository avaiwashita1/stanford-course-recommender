// Display helpers for course data.
import { DAYS, TERMS, type Course, type Meeting, type Term } from "./types";

export function formatUnits(c: Pick<Course, "unitsMin" | "unitsMax">): string {
  const u = c.unitsMin === c.unitsMax ? `${c.unitsMin}` : `${c.unitsMin}–${c.unitsMax}`;
  return `${u} unit${c.unitsMax === 1 ? "" : "s"}`;
}

function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function formatMeeting(m: Meeting): string {
  const days = [...m.days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)).join(" ");
  const time = m.start && m.end ? `${formatClock(m.start)}–${formatClock(m.end)}` : "time TBA";
  return days ? `${days} ${time}` : "Time TBA";
}

/** One line per term describing the primary (lecture/seminar) sections. */
export function scheduleSummary(c: Course): { term: Term; lines: string[]; instructors: string[] }[] {
  return TERMS.filter((t) => c.terms.includes(t)).map((term) => {
    const primary = c.sections.filter((s) => s.term === term && s.primary);
    const lines = [...new Set(primary.map((s) => (s.meetings.length ? s.meetings.map(formatMeeting).join(", ") : "Time TBA")))];
    const instructors = [...new Set(primary.flatMap((s) => s.instructors))];
    return { term, lines: lines.length ? lines : ["Time TBA"], instructors };
  });
}
