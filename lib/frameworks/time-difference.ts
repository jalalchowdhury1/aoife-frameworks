import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { from24, fmtClock } from "../clock";

const CITIES = ["Honolulu", "Denver", "New York", "London", "Moscow", "Singapore", "Auckland", "Seattle"];

// Q8 (part 1): given the SAME moment shown on two cities' clocks, find how many
// hours apart they are and which one is ahead.
export const timeDifference: Framework = {
  id: "time-difference",
  title: "Find the Time Difference",
  emoji: "🌍",
  family: "Time & Clocks",
  blurb:
    "Two cities' clocks at the same moment — count the hours between them, and say which is ahead.",
  source: "photo",
  invariant: (d) =>
    d.offset === Math.abs(d.b24 - d.a24) && d.offset >= 1 && d.offset <= 11,
  generate(rng: Rng): Problem {
    const [a, b] = rng.shuffle(CITIES).slice(0, 2);
    const offset = rng.int(1, 11);
    const bAhead = rng.pick([true, false]);
    // Keep both times on the same day (no midnight wrap) so the child can count.
    const a24 = bAhead ? rng.int(0, 23 - offset) : rng.int(offset, 23);
    const b24 = bAhead ? a24 + offset : a24 - offset;
    const aClock = from24(a24);
    const bClock = from24(b24);

    const steps: Step[] = [
      {
        id: "dir",
        input: "choice",
        ask: `Look at the two clocks. Is ${b} ahead of or behind ${a}?`,
        choices: [
          { label: `${b} is ahead`, value: "ahead" },
          { label: `${b} is behind`, value: "behind" },
        ],
        answer: bAhead ? "ahead" : "behind",
        hint: `${a} shows ${fmtClock(aClock)} and ${b} shows ${fmtClock(bClock)}, so the city with the LATER time is ahead.`,
        decoyQuestions: [
          `What time is it in ${a}?`,
          "How many hours apart are the cities?",
        ],
      },
      {
        id: "offset",
        input: "number",
        ask: `How many hours apart are they? Count the hours from ${fmtClock(aClock)} to ${fmtClock(bClock)} on the clock.`,
        answer: offset,
        hint: `Count the hours from one clock to the other: it's ${offset} hour${offset === 1 ? "" : "s"}.`,
        decoyQuestions: [
          `Is ${b} ahead or behind?`,
          `What time is it in ${b}?`,
        ],
      },
    ];

    return {
      promptText: `At the same moment, it is ${fmtClock(aClock)} in ${a} and ${fmtClock(bClock)} in ${b}. How many hours apart are the two cities, and is ${b} ahead of or behind ${a}?`,
      steps,
      finalAsk: "How many hours apart are the two cities?",
      finalAnswers: [{ label: "hours apart", value: offset }],
      data: { a24, b24, offset, ahead: bAhead ? 1 : 0 },
    };
  },
};
