import type { ReactNode } from "react";
import { CHIP_RE } from "../clock";

export type RichPart =
  | { t: "text"; v: string }
  | { t: "chip"; h: number; half: "am" | "pm" };

export function splitRich(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const m of text.matchAll(CHIP_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ t: "text", v: text.slice(last, i) });
    parts.push({ t: "chip", h: Number(m[1]), half: m[2] as "am" | "pm" });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  return parts;
}

// Gold ☀️ a.m. chip / purple 🌙 p.m. chip, inline with sentence text. Times in
// the Time & Clocks family are ALWAYS shown this way — never as naked text.
export function renderRich(text: string): ReactNode {
  return splitRich(text).map((p, i) =>
    p.t === "text" ? (
      <span key={i}>{p.v}</span>
    ) : (
      <span key={i} className={p.half === "am" ? "chip-am" : "chip-pm"}>
        {p.h}:00 {p.half === "am" ? "☀️ a.m." : "🌙 p.m."}
      </span>
    ),
  );
}
