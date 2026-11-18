import { describe, expect, it } from "vitest";
import { isAllowedEmail } from "./allowed-email";

describe("isAllowedEmail", () => {
  it("allows any email when no domain is configured", () => {
    expect(isAllowedEmail("someone@gmail.com", undefined)).toBe(true);
    expect(isAllowedEmail("someone@gmail.com", "")).toBe(true);
  });

  it("only allows the configured domain", () => {
    expect(isAllowedEmail("student@stanford.edu", "stanford.edu")).toBe(true);
    expect(isAllowedEmail("Student@Stanford.EDU", "stanford.edu")).toBe(true);
    expect(isAllowedEmail("student@gmail.com", "stanford.edu")).toBe(false);
  });

  it("rejects look-alike domains", () => {
    expect(isAllowedEmail("x@notstanford.edu", "stanford.edu")).toBe(false);
    expect(isAllowedEmail("x@stanford.edu.evil.com", "stanford.edu")).toBe(false);
  });

  it("rejects missing emails", () => {
    expect(isAllowedEmail(undefined, "stanford.edu")).toBe(false);
    expect(isAllowedEmail(null, undefined)).toBe(false);
  });
});
