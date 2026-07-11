import { describe, it, expect } from "vitest";
import { splitRich } from "./rich";

describe("splitRich", () => {
  it("tokenizes text and chips", () => {
    expect(splitRich("Start at [[9|am]] now")).toEqual([
      { t: "text", v: "Start at " },
      { t: "chip", h: 9, half: "am" },
      { t: "text", v: " now" },
    ]);
  });

  it("handles chip-only, adjacent chips, and plain text", () => {
    expect(splitRich("[[12|pm]]")).toEqual([{ t: "chip", h: 12, half: "pm" }]);
    expect(splitRich("[[7|am]][[8|pm]]")).toEqual([
      { t: "chip", h: 7, half: "am" },
      { t: "chip", h: 8, half: "pm" },
    ]);
    expect(splitRich("plain")).toEqual([{ t: "text", v: "plain" }]);
  });
});
