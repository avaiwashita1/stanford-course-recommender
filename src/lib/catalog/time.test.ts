import { describe, expect, it } from "vitest";
import { parseDay, parseTime, toMinutes } from "./time";

describe("parseTime", () => {
  it("converts 12-hour times to 24-hour", () => {
    expect(parseTime("1:30:00 PM")).toBe("13:30");
    expect(parseTime("10:30:00 AM")).toBe("10:30");
    expect(parseTime("12:00:00 PM")).toBe("12:00");
    expect(parseTime("12:15:00 AM")).toBe("00:15");
    expect(parseTime("9:05 am")).toBe("09:05");
  });
  it("returns null for TBA", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime(undefined)).toBeNull();
    expect(parseTime("TBA")).toBeNull();
  });
});

describe("parseDay / toMinutes", () => {
  it("parses day names", () => {
    expect(parseDay("Thursday")).toBe("Thu");
    expect(parseDay(" monday ")).toBe("Mon");
    expect(parseDay("Funday")).toBeNull();
  });
  it("converts to minutes", () => {
    expect(toMinutes("13:30")).toBe(810);
  });
});
