import { describe, expect, it } from "vitest";
import { formatMeeting, formatUnits, scheduleSummary } from "./format";
import { course, meeting, section } from "./test-helpers";

describe("format helpers", () => {
  it("formats units", () => {
    expect(formatUnits({ unitsMin: 3, unitsMax: 5 })).toBe("3–5 units");
    expect(formatUnits({ unitsMin: 1, unitsMax: 1 })).toBe("1 unit");
  });
  it("formats meetings", () => {
    expect(formatMeeting(meeting({ days: ["Thu", "Tue"], start: "13:30", end: "14:50" }))).toBe("Tue Thu 1:30pm–2:50pm");
    expect(formatMeeting(meeting({ days: ["Mon"], start: "12:00", end: "13:00" }))).toBe("Mon 12pm–1pm");
    expect(formatMeeting(meeting({ days: [], start: null, end: null }))).toBe("Time TBA");
  });
  it("summarizes schedules per term", () => {
    const c = course({
      terms: ["Autumn", "Winter"],
      sections: [
        section({ term: "Winter", instructors: ["A"], meetings: [] }),
        section({ term: "Autumn", instructors: ["B"] }),
        section({ term: "Autumn", primary: false, component: "DIS", instructors: ["TA"] }),
      ],
    });
    expect(scheduleSummary(c)).toEqual([
      { term: "Autumn", lines: ["Mon Wed Fri 10:30am–11:20am"], instructors: ["B"] },
      { term: "Winter", lines: ["Time TBA"], instructors: ["A"] },
    ]);
  });
});
