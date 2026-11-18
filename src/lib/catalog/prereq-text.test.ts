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
  it("keeps the whole sentence when prerequisites are mentioned without a label", () => {
    expect(
      extractPrereqText(
        "Intro to SymSys. The material will be at an introductory level, without prerequisites. Taught by many faculty. More text.",
      ),
    ).toBe("The material will be at an introductory level, without prerequisites. Taught by many faculty.");
    expect(
      extractPrereqText("Design with Figma. Limited enrollment. No required prerequisites. Recommended: some design experience."),
    ).toBe("No required prerequisites. Recommended: some design experience.");
  });

  it("returns null when there are no prerequisites mentioned", () => {
    expect(extractPrereqText("An introduction to programming.")).toBeNull();
  });
});
