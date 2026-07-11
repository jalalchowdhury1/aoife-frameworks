import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { from24, type AmPm } from "../clock";
import { AM_ANCHORS, PM_ANCHORS, halfChoices, c } from "./time-shared";

// Day 1 · 🏠 Aoife's Day — "Morning or After-Lunch?"
// THE foundation idea of the whole ladder: a.m. = the gold ☀️ half before
// lunch, p.m. = the purple 🌙 half after lunch. She sorts her own day's events
// by finding them on the day-line, then counts the after-lunch ones.
export const amPm: Framework = {
  id: "am-pm",
  title: "Morning or After-Lunch?",
  emoji: "🌅",
  family: "Time & Clocks",
  blurb:
    "Before lunch is the ☀️ half, after lunch is the 🌙 half. Sort Aoife's day, then count.",
  source: "photo",
  invariant: (d) =>
    d.amCount + d.pmCount === 4 &&
    d.pmCount >= 1 &&
    d.pmCount <= 3 &&
    [d.e0, d.e1, d.e2, d.e3].every((h) => h >= 0 && h <= 23),
  generate(rng: Rng): Problem {
    const pmCount = rng.int(1, 3);
    const amCount = 4 - pmCount;
    const ams = rng.shuffle([...AM_ANCHORS]).slice(0, amCount);
    const pms = rng.shuffle([...PM_ANCHORS]).slice(0, pmCount);
    const events = rng.shuffle([...ams, ...pms]);

    const steps: Step[] = events.map((e, i) => {
      const clock = from24(e.h);
      const ampm: AmPm = clock.ampm;
      return {
        id: `ev${i}`,
        input: "choice" as const,
        ask: `Aoife ${e.label} ${e.icon} at ${c(clock.h12, ampm)}. Is that before or after lunch?`,
        choices: halfChoices,
        answer: ampm,
        hint:
          ampm === "a.m."
            ? `Find ${e.icon} on the day-line — it sits under the gold ☀️ ribbon, before 🥪 lunch.`
            : `Find ${e.icon} on the day-line — it sits under the purple 🌙 ribbon, after 🥪 lunch.`,
        decoyQuestions: [
          "How many events are there in all?",
          "How many hours are in a whole day?",
        ],
      };
    });

    steps.push({
      id: "count",
      input: "number",
      ask: "Now count: how many of Aoife's events happen AFTER lunch (the 🌙 p.m. half)?",
      answer: pmCount,
      hint: "Look back at the ones you put under the purple 🌙 ribbon and count them.",
      decoyQuestions: [
        "How many happen before lunch?",
        "How many events are there in all?",
      ],
    });

    const list = events
      .map((e) => `${e.label} ${e.icon} at ${c(from24(e.h).h12, from24(e.h).ampm)}`)
      .join(", ");
    return {
      promptText: `In one day, Aoife: ${list}. How many of these happen AFTER lunch — in the 🌙 p.m. half of the day?`,
      figure: {
        kind: "dayLine",
        events: events.map((e) => ({ hour24: e.h, icon: e.icon })),
      },
      steps,
      finalAsk: "How many events happen after lunch (p.m.)?",
      finalAnswers: [{ label: "after lunch (p.m.)", value: pmCount }],
      data: {
        amCount,
        pmCount,
        e0: events[0].h,
        e1: events[1].h,
        e2: events[2].h,
        e3: events[3].h,
      },
    };
  },
};
