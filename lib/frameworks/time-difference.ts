import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { from24 } from "../clock";
import { warmupRead24, CITIES, c, plural } from "./time-shared";

// Day 6 · 🌍 Around the World — "Who's Ahead?"
// One moment, two clocks. The NOW line crosses both cities' day-lines — she
// counts the hops between the marks. "Ahead" = further along in their day,
// like being on a later page of the same book. Offsets stay small (1–5):
// the counting idea is what's new today.
export const timeDifference: Framework = {
  id: "time-difference",
  title: "Who's Ahead?",
  emoji: "🌍",
  family: "Time & Clocks",
  blurb: "Two clocks, one moment — count the hops between them. The later one is ahead.",
  source: "photo",
  invariant: (d) =>
    d.offset === Math.abs(d.b24 - d.a24) &&
    d.offset >= 1 &&
    d.offset <= 5 &&
    d.a24 >= 0 &&
    d.b24 >= 0 &&
    d.a24 <= 23 &&
    d.b24 <= 23,
  generate(rng: Rng): Problem {
    const [a, b] = rng.shuffle([...CITIES]).slice(0, 2);
    const offset = rng.int(1, 5);
    const bAhead = rng.pick([true, false]);
    // Same calendar day on both clocks — no midnight wrap, so she can count.
    const a24 = bAhead ? rng.int(7, 23 - offset) : rng.int(7 + offset, 23);
    const b24 = bAhead ? a24 + offset : a24 - offset;
    const aClock = from24(a24);
    const bClock = from24(b24);
    const earlier24 = Math.min(a24, b24);
    const earlier = from24(earlier24);
    const later = from24(Math.max(a24, b24));

    const steps: Step[] = [
      warmupRead24(rng),
      {
        id: "ahead",
        input: "choice",
        ask: `At the SAME moment, ${a}'s clock says ${c(aClock.h12, aClock.ampm)} and ${b}'s says ${c(bClock.h12, bClock.ampm)}. Which city is AHEAD?`,
        choices: [
          { label: `${a} is ahead`, value: "A" },
          { label: `${b} is ahead`, value: "B" },
        ],
        answer: bAhead ? "B" : "A",
        hint: `Ahead means further along in the day — like a later page of the same book. ${bAhead ? b : a}'s clock shows the LATER time, so their day is further along.`,
        decoyQuestions: [
          "How many hours apart are the cities?",
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "gap",
        input: "line-hop",
        inputSpec: {
          kind: "dayLine",
          variant: "stacked",
          nowA: a24,
          offsetB: b24 - a24,
          cityA: a,
          cityB: b,
          start: earlier24,
          hops: offset,
          mode: "count",
          target: earlier24 + offset, // the later mark — 🚩 on the strip
        },
        ask: `Count the hops from the earlier mark (${c(earlier.h12, earlier.ampm)}) to the later one (${c(later.h12, later.ampm)}). How many hours apart are they?`,
        answer: offset,
        hint: `Start on ${c(earlier.h12, earlier.ampm)} and hop toward ${c(later.h12, later.ampm)}, counting each hop out loud — the count is your answer.`,
        decoyQuestions: [
          `Which city is ahead?`,
          "How many hours are in a whole day?",
        ],
      },
    ];

    return {
      promptText: `It's one single moment in time ⏱️ — but ${a}'s clock says ${c(aClock.h12, aClock.ampm)} while ${b}'s clock says ${c(bClock.h12, bClock.ampm)}. How many hours apart are the two cities?`,
      figure: {
        kind: "dayLine",
        variant: "stacked",
        nowA: a24,
        offsetB: b24 - a24,
        cityA: a,
        cityB: b,
      },
      steps,
      finalAsk: "How many hours apart are the two cities?",
      finalAnswers: [{ label: `${plural(offset)} apart`, value: offset }],
      data: { a24, b24, offset, ahead: bAhead ? 1 : 0 },
    };
  },
};
