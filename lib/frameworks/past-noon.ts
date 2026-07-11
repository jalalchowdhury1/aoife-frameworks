import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { from24 } from "../clock";
import { warmupHop, c, plural } from "./time-shared";

const DOINGS = [
  "starts a jigsaw puzzle 🧩",
  "goes to the library 📚",
  "helps in the garden 🌻",
  "starts a movie marathon 🎬",
  "goes on a bike ride 🚲",
];

// Day 3 · 🏠 Aoife's Day — "Past Lunchtime!"
// ONE new idea: hop across the 🥪 noon marker and the half FLIPS — she SEES
// the day-line change from gold to purple mid-hop. (The same flip happens at
// 💤 midnight while she sleeps — mentioned, never the main event.) One problem
// in four doesn't cross, so "will you pass lunch?" stays a real question.
export const pastNoon: Framework = {
  id: "past-noon",
  title: "Past Lunchtime!",
  emoji: "🌞",
  family: "Time & Clocks",
  blurb: "Hop across 🥪 lunchtime and watch the ☀️ half flip to 🌙 — no rules, just look!",
  source: "added",
  invariant: (d) =>
    d.land24 === d.s24 + d.hop &&
    (d.crossed === 1) === d.land24 >= 12 &&
    d.hop >= 1 &&
    d.hop <= 4 &&
    d.s24 >= 8 &&
    d.s24 <= 11,
  generate(rng: Rng): Problem {
    const crossing = rng.int(1, 4) <= 3; // 3-in-4 cross lunch
    const s24 = crossing ? rng.int(9, 11) : rng.int(8, 9);
    const land24 = crossing
      ? rng.int(12, Math.min(15, s24 + 4))
      : rng.int(s24 + 1, Math.min(11, s24 + 2));
    const hop = land24 - s24;
    const landClock = from24(land24);
    const doing = rng.pick(DOINGS);

    const steps: Step[] = [
      warmupHop(rng),
      {
        id: "cross",
        input: "choice",
        ask: `Aoife starts at ${c(s24, "a.m.")} and hops ${hop} ${plural(hop)} forward. Will she hop PAST 🥪 lunchtime?`,
        choices: [
          { label: "Yes — past lunch! 🥪➡️🌙", value: "yes" },
          { label: "No — still before lunch ☀️", value: "no" },
        ],
        answer: crossing ? "yes" : "no",
        hint: `Find ${s24} o'clock on the day-line and look: how many cells until the 🥪 marker? Is ${hop} enough to reach it?`,
        decoyQuestions: [
          "What hour does she land on?",
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "half",
        input: "choice",
        ask: "After the hops, is Aoife in the ☀️ half or the 🌙 half?",
        choices: [
          { label: "☀️ before lunch (a.m.)", value: "a.m." },
          { label: "🌙 after lunch (p.m.)", value: "p.m." },
        ],
        answer: landClock.ampm,
        hint: crossing
          ? "She stepped across 🥪 lunch — the gold half ends there, so she's in the purple 🌙 half now. The flip happens all by itself!"
          : `All ${hop} ${plural(hop)} stay under the gold ☀️ ribbon — no lunch crossed, no flip.`,
        decoyQuestions: [
          "How many hops did Aoife make?",
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "land",
        input: "line-hop",
        inputSpec: {
          kind: "dayLine",
          hopFrom: s24,
          hopTo: land24,
          start: s24,
          hops: hop,
          mode: "land",
        },
        ask: `Hop the ${hop} ${plural(hop)} on the day-line. What hour does Aoife land on?`,
        answer: landClock.h12,
        hint: crossing
          ? `Count each hop out loud. When you step past 🥪, the numbers start over: … 11, 12, 1, 2.`
          : `Count each hop out loud — you stay in the morning numbers the whole way.`,
        decoyQuestions: [
          "Is she before or after lunch now?",
          "How many hours are in a whole day?",
        ],
      },
    ];

    return {
      promptText: `At ${c(s24, "a.m.")} Aoife ${doing}. She keeps going for ${hop} ${plural(hop)}. What time is it when she stops?${
        crossing ? " (Psst — the same flip happens at 💤 midnight, while you're fast asleep.)" : ""
      }`,
      // Start cell only — hop arcs drawn to the landing would reveal the answer.
      figure: {
        kind: "dayLine",
        highlight: s24,
      },
      steps,
      finalAsk: "What hour does Aoife stop at?",
      finalAnswers: [{ label: "o'clock", value: landClock.h12 }],
      data: { s24, hop, land24, crossed: crossing ? 1 : 0 },
    };
  },
};
