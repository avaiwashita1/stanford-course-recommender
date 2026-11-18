import type { Day } from "./types";

const DAY_NAMES: Record<string, Day> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

/** "Thursday" -> "Thu". Returns null for anything unrecognised. */
export function parseDay(name: string): Day | null {
  return DAY_NAMES[name.trim().toLowerCase()] ?? null;
}

/** "1:30:00 PM" -> "13:30". Returns null for empty / unparseable input (TBA). */
export function parseTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
  if (!m) return null;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${m[2]}`;
}

/** "13:30" -> 810 (minutes since midnight). */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
