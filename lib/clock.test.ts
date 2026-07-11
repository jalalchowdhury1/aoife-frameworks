import { describe, it, expect } from "vitest";
import { chip, chipText, to24, from24, addHours, ANCHORS } from "./clock";

describe("chip tokens", () => {
  it("chip() emits a [[h|half]] token", () => {
    expect(chip({ h12: 7, ampm: "a.m." })).toBe("[[7|am]]");
    expect(chip({ h12: 12, ampm: "p.m." })).toBe("[[12|pm]]");
  });

  it("chipText() renders the plain-text form", () => {
    expect(chipText("[[7|am]]")).toBe("7:00 ☀️ a.m.");
    expect(chipText("It lands at [[3|pm]] today")).toBe("It lands at 3:00 🌙 p.m. today");
    expect(chipText("no chips here")).toBe("no chips here");
  });

  it("round-trips with clock math", () => {
    expect(chip(addHours(from24(to24(11, "a.m.")), 2))).toBe("[[1|pm]]");
    expect(chip(addHours({ h12: 11, ampm: "p.m." }, 2))).toBe("[[1|am]]");
  });

  it("anchors exist at the taught hours", () => {
    expect(ANCHORS[12].icon).toBe("🥪");
    expect(Object.keys(ANCHORS).length).toBeGreaterThanOrEqual(6);
  });
});
