import { describe, expect, it } from "vitest";
import { pagesToLines } from "./layout";

describe("pagesToLines", () => {
  it("reads the left column before the right, top to bottom", () => {
    const item = (str: string, x: number, y: number) => ({ str, x, y, width: 10 });
    const lines = pagesToLines([
      {
        width: 600,
        items: [
          item("2024-2025 Winter", 350, 700),
          item("2023-2024 Autumn", 50, 700),
          item("MATH", 350, 680),
          item("51", 400, 680.8), // slightly different baseline, same line
          item("CS", 50, 680),
          item("106A", 100, 680),
        ],
      },
    ]);
    expect(lines).toEqual(["2023-2024 Autumn", "CS 106A", "2024-2025 Winter", "MATH 51"]);
  });
});
