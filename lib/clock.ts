// Pure clock helpers for the Time & Clocks frameworks. Whole-hour math only, so
// minutes never change and the *reasoning* (which direction, does it cross
// noon/midnight) is the whole challenge — not the arithmetic.

export type AmPm = "a.m." | "p.m.";
export interface Clock {
  h12: number; // 1..12 as shown on a clock face
  ampm: AmPm;
}

// 12-hour clock -> hour-of-day 0..23. Midnight (12 a.m.) = 0, noon (12 p.m.) = 12.
export function to24(h12: number, ampm: AmPm): number {
  if (ampm === "a.m.") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

// hour-of-day (any integer) -> 12-hour clock, wrapping correctly across days.
export function from24(h24: number): Clock {
  const h = ((h24 % 24) + 24) % 24;
  const ampm: AmPm = h < 12 ? "a.m." : "p.m.";
  const raw = h % 12;
  return { h12: raw === 0 ? 12 : raw, ampm };
}

// Add (or, with a negative d, subtract) whole hours to a clock time.
export function addHours(c: Clock, d: number): Clock {
  return from24(to24(c.h12, c.ampm) + d);
}

export function fmtClock(c: Clock): string {
  return `${c.h12}:00 ${c.ampm}`;
}

// Does adding `d` hours to clock `c` cross 12 o'clock (noon or midnight)? Used
// only to script the "did we flip a.m./p.m.?" self-question.
export function crossesTwelve(c: Clock, d: number): boolean {
  return c.ampm !== addHours(c, d).ampm;
}
