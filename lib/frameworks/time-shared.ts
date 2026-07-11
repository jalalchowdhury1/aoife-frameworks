import type { Step } from "../types";
import type { Rng } from "../rng";
import { chip, from24, ANCHORS, type AmPm } from "../clock";

// Shared vocabulary for the Time & Clocks 9-day ladder. Days 1–5 star Aoife
// herself; Days 6–9 travel. Every time value in text goes through c() — the
// chip renderer owns how times look.

export const CITIES = [
  "Dublin",
  "London",
  "New York",
  "Toronto",
  "Dhaka",
  "Singapore",
  "Honolulu",
  "Sydney",
];

export const AM_ANCHORS = [7, 8, 9].map((h) => ({ h, ...ANCHORS[h] }));
export const PM_ANCHORS = [16, 18, 20].map((h) => ({ h, ...ANCHORS[h] }));

export const halfChoices = [
  { label: "☀️ before lunch (a.m.)", value: "a.m." },
  { label: "🌙 after lunch (p.m.)", value: "p.m." },
];

export const c = (h12: number, ampm: AmPm) => chip({ h12, ampm });
export const c24 = (h24: number) => chip(from24(h24));

export const plural = (n: number) => (n === 1 ? "hour" : "hours");

/* ------------------------- warm-up factories -------------------------
 * Day N opens with warmupDay(N-1)'s core skill, flagged warmup: true.
 * Warm-ups are tiny and self-contained: their numbers are independent of
 * the day's main problem, and they never appear in the Solo stage. */

// Day 1 skill: which half of the day is an anchor event in?
export function warmupHalf(rng: Rng): Step {
  const e = rng.pick([...AM_ANCHORS, ...PM_ANCHORS]);
  const ampm: AmPm = e.h < 12 ? "a.m." : "p.m.";
  return {
    id: "warmup",
    warmup: true,
    input: "choice",
    ask: `⭐ Warm-up — remember yesterday? Aoife ${e.label} ${e.icon}. Is that before or after lunch?`,
    choices: halfChoices,
    answer: ampm,
    hint:
      ampm === "a.m."
        ? `${e.icon} happens before 🥪 lunchtime — that's the gold ☀️ half.`
        : `${e.icon} happens after 🥪 lunchtime — that's the purple 🌙 half.`,
    decoyQuestions: ["How many hours are in a whole day?", "What time is lunch?"],
  };
}

// Day 2 skill: a small same-half hop (no crossing, no wrap).
export function warmupHop(rng: Rng): Step {
  const s = rng.int(1, 8);
  const k = rng.int(1, Math.min(3, 10 - s));
  const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
  return {
    id: "warmup",
    warmup: true,
    input: "number",
    ask: `⭐ Warm-up — remember yesterday? Start at ${c(s, ampm)} and hop ${k} ${plural(k)} forward. What hour do you land on?`,
    answer: s + k,
    hint: `Count the hops out loud: ${s}… then ${k} more. You never reach 🥪 lunchtime, so nothing tricky happens.`,
    decoyQuestions: ["Is the time before or after lunch?", "How many hours are in a whole day?"],
  };
}

// Day 3 skill: does a hop cross 🥪 lunchtime?
export function warmupCross(rng: Rng): Step {
  const s = rng.int(9, 11);
  const crosses = s === 11 ? true : rng.pick([true, false]);
  const k = crosses ? rng.int(12 - s, 3) : rng.int(1, 11 - s);
  const yes = s + k >= 12;
  return {
    id: "warmup",
    warmup: true,
    input: "choice",
    ask: `⭐ Warm-up — remember yesterday? Aoife is at ${c(s, "a.m.")} and hops ${k} ${plural(k)} forward. Does she hop past 🥪 lunchtime?`,
    choices: [
      { label: "Yes — past lunch, into the 🌙 half", value: "yes" },
      { label: "No — still in the ☀️ half", value: "no" },
    ],
    answer: yes ? "yes" : "no",
    hint: `From ${s} o'clock, lunch is ${12 - s} ${plural(12 - s)} away. Is the hop bigger than that?`,
    decoyQuestions: ["What hour does she land on?", "How many hours are in a whole day?"],
  };
}

// Day 4 skill: a tiny clock add (kept wrap-free so it stays a 5-second warm-up).
export function warmupClockAdd(rng: Rng): Step {
  const s = rng.int(1, 8);
  const k = rng.int(1, Math.min(3, 11 - s));
  const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
  return {
    id: "warmup",
    warmup: true,
    input: "number",
    ask: `⭐ Warm-up — remember yesterday? The clock hand is at ${c(s, ampm)}. Hop it ${k} ${plural(k)} around. Where does it point?`,
    answer: s + k,
    hint: `Tap around the clock in your head: ${k} little hops from ${s}.`,
    decoyQuestions: ["Did the hand pass the 12 at the top?", "Is it before or after lunch?"],
  };
}

// Day 5 skill: read a p.m. time on the keep-counting (24-hour) clock.
export function warmupRead24(rng: Rng): Step {
  const h = rng.int(1, 9);
  return {
    id: "warmup",
    warmup: true,
    input: "number",
    ask: `⭐ Warm-up — remember yesterday? What does the keep-counting clock say at ${c(h, "p.m.")}?`,
    answer: h + 12,
    hint: `After 🥪 lunch the clock keeps counting: 12, 13, 14… — ${h} past lunch is ${h} past 12.`,
    decoyQuestions: ["Is the time before or after lunch?", "How many hours are in a whole day?"],
  };
}

// Day 6 skill: the later clock is further along its day — it's "ahead".
export function warmupAhead(rng: Rng): Step {
  const a = rng.int(1, 5);
  const b = rng.int(a + 1, Math.min(a + 5, 11));
  const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
  const [first, second] = rng.pick([true, false]) ? [a, b] : [b, a];
  const later = Math.max(first, second);
  return {
    id: "warmup",
    warmup: true,
    input: "choice",
    ask: `⭐ Warm-up — remember yesterday? One clock says ${c(first, ampm)} and another says ${c(second, ampm)}. Which one is AHEAD?`,
    choices: [
      { label: `The ${c(first, ampm)} clock`, value: first },
      { label: `The ${c(second, ampm)} clock`, value: second },
    ],
    answer: later,
    hint: `Ahead means further along in the day — like a later page of the same book. Which time comes later?`,
    decoyQuestions: ["How many hours apart are the clocks?", "How many hours are in a whole day?"],
  };
}

// Day 7 skill: ahead = hop forward, behind = hop back.
export function warmupDirection(rng: Rng): Step {
  const [a, b] = rng.shuffle([...CITIES]).slice(0, 2);
  const k = rng.int(1, 6);
  const ahead = rng.pick([true, false]);
  return {
    id: "warmup",
    warmup: true,
    input: "choice",
    ask: `⭐ Warm-up — remember yesterday? ${b}'s clocks are ${k} ${plural(k)} ${ahead ? "AHEAD of" : "BEHIND"} ${a}'s. Which way do you hop to find ${b}'s time?`,
    choices: [
      { label: "⏩ forward (later)", value: "forward" },
      { label: "⏪ back (earlier)", value: "back" },
    ],
    answer: ahead ? "forward" : "back",
    hint: ahead
      ? "Ahead = further along their day = hop forward."
      : "Behind = earlier in their day = hop back.",
    decoyQuestions: [`What time is it in ${a}?`, "How many hours apart are the cities?"],
  };
}

// Day 8 skill: two jumps become one.
export function warmupCombine(rng: Rng): Step {
  const x = rng.int(3, 6);
  const y = rng.int(1, x - 1);
  return {
    id: "warmup",
    warmup: true,
    input: "number",
    ask: `⭐ Warm-up — remember yesterday? Hop ${x} ${plural(x)} forward, then ${y} ${plural(y)} back. That's the same as ONE jump of how many hours forward?`,
    answer: x - y,
    hint: `Try it on the day-line: ${x} forward, ${y} back — you end up ${x - y} ahead. (That's ${x} − ${y}.)`,
    decoyQuestions: ["Which way did you hop first?", "How many hours are in a whole day?"],
  };
}
