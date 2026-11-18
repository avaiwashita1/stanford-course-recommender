import { describe, expect, it } from "vitest";
import { extractPrereqText } from "./prereq-text";

describe("extractPrereqText", () => {
  it("extracts the prerequisite sentence", () => {
    expect(
      extractPrereqText("Algorithms. Prerequisite: 106B or 106X; 103 or 103B; 109 or STATS 116."),
    ).toBe("Prerequisite: 106B or 106X; 103 or 103B; 109 or STATS 116.");
  });
  it("stops before unrelated trailing sentences", () => {
    expect(
      extractPrereqText(
        "Systems. Prerequisite: CS106B or CS106X, and consent of instructor.  Students may not earn credit for both CS107 and CS107E.",
      ),
    ).toBe("Prerequisite: CS106B or CS106X, and consent of instructor.");
  });
  it("returns null when there are no prerequisites mentioned", () => {
    expect(extractPrereqText("An introduction to programming.")).toBeNull();
  });
});
