import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];
// a.m. = midnight→noon (morning). p.m. = noon→midnight (afternoon/evening/night).
const AM_EVENTS = [
  { act: "wakes up", h: 7 },
  { act: "eats breakfast", h: 8 },
  { act: "starts school", h: 9 },
  { act: "sees the sun come up", h: 6 },
];
const PM_EVENTS = [
  { act: "plays after school", h: 4 },
  { act: "eats dinner", h: 6 },
  { act: "reads a bedtime story", h: 8 },
  { act: "watches the sunset", h: 7 },
];

// Foundation: decide a.m. or p.m. from the part of the day, then COUNT the p.m. ones.
export const amPm: Framework = {
  id: "am-pm",
  title: "A.M. or P.M.?",
  emoji: "🌅",
  family: "Time & Clocks",
  blurb:
    "Morning is a.m., afternoon and night are p.m. Sort a day's events, then count the p.m. ones.",
  source: "photo",
  invariant: (d) => d.amCount + d.pmCount === 4 && d.pmCount >= 1 && d.pmCount <= 3,
  generate(rng: Rng): Problem {
    const name = rng.pick(NAMES);
    const pmCount = rng.int(1, 3);
    const amCount = 4 - pmCount;
    const ams = rng.shuffle(AM_EVENTS).slice(0, amCount).map((e) => ({ ...e, ampm: "a.m." }));
    const pms = rng.shuffle(PM_EVENTS).slice(0, pmCount).map((e) => ({ ...e, ampm: "p.m." }));
    const events = rng.shuffle([...ams, ...pms]);

    const steps: Step[] = events.map((e, i) => ({
      id: `ev${i}`,
      input: "choice" as const,
      ask: `${name} ${e.act} at ${e.h}:00. Is that a.m. or p.m.?`,
      choices: [
        { label: "a.m. (morning)", value: "a.m." },
        { label: "p.m. (afternoon / night)", value: "p.m." },
      ],
      answer: e.ampm,
      hint:
        e.ampm === "a.m."
          ? "This happens in the MORNING — before noon — so it's a.m."
          : "This happens in the AFTERNOON or at NIGHT — after noon — so it's p.m.",
      decoyQuestions: [
        "How many events are there in all?",
        "What time does the next event happen?",
      ],
    }));

    steps.push({
      id: "count",
      input: "number",
      ask: "Now count them: how many of these events happen in the p.m.?",
      answer: pmCount,
      hint: "Look back at which ones you marked p.m. (afternoon/night) and count them.",
      decoyQuestions: [
        "How many happen in the a.m.?",
        "How many events are there in all?",
      ],
    });

    const list = events.map((e) => `${e.act} at ${e.h}:00`).join(", ");
    return {
      promptText: `In one day, ${name} does these things: ${list}. How many of them happen in the p.m. (afternoon or night)?`,
      steps,
      finalAsk: "How many events happen in the p.m.?",
      finalAnswers: [{ label: "in the p.m.", value: pmCount }],
      data: { amCount, pmCount },
    };
  },
};
