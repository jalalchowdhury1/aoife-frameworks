import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, type AmPm } from "../clock";
import { warmupHalf, c, plural } from "./time-shared";

const DOINGS = [
  "reading her book 📖",
  "building a LEGO castle 🏰",
  "painting a picture 🎨",
  "visiting Granny 👵",
  "baking cookies 🍪",
];

// Day 2 · 🏠 Aoife's Day — "Hop the Hours"
// ONE new idea: adding hours = hopping forward, one hop per hour. Hops NEVER
// cross 🥪 lunchtime here — no flip, no wrap, nothing tricky. Just counting.
export const hopHours: Framework = {
  id: "hop-hours",
  title: "Hop the Hours",
  emoji: "🐇",
  family: "Time & Clocks",
  blurb: "Adding hours = hopping forward. Count the hops — nothing tricky yet!",
  source: "added",
  invariant: (d) =>
    d.land === d.s + d.k &&
    d.land <= 11 &&
    d.k >= 1 &&
    d.k <= 3 &&
    d.s >= 1 &&
    (d.fig === 0 || d.fig === 1),
  generate(rng: Rng): Problem {
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const s = rng.int(1, 8);
    const k = rng.int(1, Math.min(3, 11 - s));
    const land = s + k;
    const fig = rng.pick([0, 1]); // 0 = day-line hop, 1 = clock-face hop
    const doing = rng.pick(DOINGS);

    const figure =
      fig === 0
        ? {
            kind: "dayLine",
            hopFrom: to24(s, ampm),
            hopTo: to24(land, ampm),
            // input fields
            start: to24(s, ampm),
            hops: k,
            mode: "land",
          }
        : {
            kind: "clockFace",
            hour: land,
            ampm: ampm === "a.m." ? "am" : "pm",
            ghostHour: s,
            // input fields
            hops: k,
          };

    const steps: Step[] = [
      warmupHalf(rng),
      {
        id: "same-half",
        input: "choice",
        ask: `Aoife hops ${k} ${plural(k)} forward from ${c(s, ampm)}. Does she stay in the same half of the day?`,
        choices: [
          { label: "Yes — same half", value: "same" },
          { label: "No — the half flips", value: "flips" },
        ],
        answer: "same",
        hint: `Look at the day-line: every hop stays under the ${ampm === "a.m." ? "gold ☀️" : "purple 🌙"} ribbon — she never reaches 🥪 lunchtime${ampm === "p.m." ? " or 💤 midnight" : ""}.`,
        decoyQuestions: [
          "How many hours are in a whole day?",
          "What time is lunch?",
        ],
      },
      {
        id: "land",
        input: fig === 0 ? "line-hop" : "clock-set",
        inputSpec: figure,
        ask: `Start at ${c(s, ampm)} and hop ${k} ${plural(k)} forward. What hour do you land on?`,
        answer: land,
        hint: `Tap one hop at a time and count out loud — 1… 2… you'll land right on it. On the clock it's the same: the hand moves ${k} number${k === 1 ? "" : "s"} around.`,
        decoyQuestions: [
          "Is the landing time before or after lunch?",
          "How many hours are in a whole day?",
        ],
      },
    ];

    return {
      promptText: `Aoife starts ${doing} at ${c(s, ampm)}. She keeps going for ${k} ${plural(k)}. What hour does she finish?`,
      figure,
      steps,
      finalAsk: "What hour does Aoife finish?",
      finalAnswers: [{ label: "o'clock", value: land }],
      data: { s, k, land, isPm: ampm === "p.m." ? 1 : 0, fig },
    };
  },
};
