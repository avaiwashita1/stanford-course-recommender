import { describe, expect, it } from "vitest";
import { dedupeCrossListings, linkCrossListings } from "./cross-listings";
import { course } from "./test-helpers";

describe("cross-listings", () => {
  const linked = linkCrossListings([
    course({ id: "CS 229", courseId: 7 }),
    course({ id: "STATS 229", courseId: 7 }),
    course({ id: "MATH 51", courseId: 9 }),
  ]);

  it("links courses that share a courseId", () => {
    expect(linked.map((c) => c.crossListings)).toEqual([["STATS 229"], ["CS 229"], []]);
  });

  it("keeps only the first listing of each class", () => {
    const ranked = [linked[1], linked[2], linked[0]];
    expect(dedupeCrossListings(ranked).map((c) => c.id)).toEqual(["STATS 229", "MATH 51"]);
  });
});
