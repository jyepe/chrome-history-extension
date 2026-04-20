import { describe, it, expect } from "vitest";
import { parseHost, hostLetter, hostColor } from "@/lib/domain";

describe("parseHost", () => {
  it("extracts hostname from https URL", () => {
    expect(parseHost("https://github.com/anthropics/claude-sdk")).toBe(
      "github.com",
    );
  });
  it("extracts hostname from http URL", () => {
    expect(parseHost("http://example.com:8080/path")).toBe("example.com");
  });
  it("returns empty string for invalid URL", () => {
    expect(parseHost("not a url")).toBe("");
  });
  it("strips leading www.", () => {
    expect(parseHost("https://www.udemy.com/course/x")).toBe("udemy.com");
  });
});

describe("hostLetter", () => {
  it("returns first uppercase alphanumeric character", () => {
    expect(hostLetter("github.com")).toBe("G");
    expect(hostLetter("news.ycombinator.com")).toBe("N");
    expect(hostLetter("9gag.com")).toBe("9");
  });
  it('falls back to "·" when no alphanumeric char exists', () => {
    expect(hostLetter("")).toBe("·");
    expect(hostLetter("...")).toBe("·");
  });
});

describe("hostColor", () => {
  it("returns a deterministic oklch color for the same host", () => {
    expect(hostColor("github.com")).toBe(hostColor("github.com"));
  });
  it("returns different colors for different hosts", () => {
    expect(hostColor("github.com")).not.toBe(hostColor("figma.com"));
  });
  it("always returns a valid oklch string", () => {
    expect(hostColor("github.com")).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
  });
});
