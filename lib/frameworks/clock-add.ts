import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { addHours, crossesTwelve, type AmPm } from "../clock";
import { warmupCross, halfChoices, c, plural } from "./time-shared";

const ACTS = [
  "the bake sale 🧁",
  "the long car trip 🚗",
  "the sleepover games 🎲",
  "the boat ride ⛵",
  "the camping trip 🏕️",
];

// Day 4 · 🏠 Aoife's Day — "Around the Clock"
// Day 2 (hopping) + Day 3 (the flip) together. The hand loops past the 12 all
// by itself — "after 12 comes 1" is something she WATCHES happen while
// counting taps. The −12 arithmetic is only a ✨ magic shortcut in a hint.
export const clockAdd: Framework = {
  id: "clock-add",
  title: "Around the Clock",
  emoji: "🕒",
  family: "Time & Clocks",
  blurb: "Hop the hand around the clock — after 12 comes 1, all by itself.",
  source: "added",
  invariant: (d) =>
    d.sum === d.h12 + d.add &&
    d.result === ((d.h12 + d.add - 1) % 12) + 1 &&
    (d.flip === 1) === d.sum >= 12 &&
    d.h12 >= 1 &&
    d.h12 <= 11 &&
    d.add >= 1 &&
    d.add <= 8,
  generate(rng: Rng): Problem {
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    // No 12 start (keeps "past the 12?" honest) and no middle-of-the-night
    // starts: morning activities begin 7-11 a.m., afternoon ones 1-11 p.m.
    const h12 = ampm === "a.m." ? rng.int(7, 11) : rng.int(1, 11);
    const add = rng.int(1, 8);
    const start = { h12, ampm };
    const sum = h12 + add;
    const end = addHours(start, add);
    const flip = crossesTwelve(start, add);
    const act = rng.pick(ACTS);
    const crossWord = ampm === "a.m." ? "🥪 lunch" : "💤 midnight";

    const steps: Step[] = [
      warmupCross(rng),
      {
        id: "pass12",
        input: "choice",
        ask: `The hand starts at ${h12} and hops ${add} ${plural(add)}. Will it reach or go PAST the 12 at the top?`,
        choices: [
          { label: "Yes — past the top! 🔝", value: "yes" },
          { label: "No — it stays before 12", value: "no" },
        ],
        answer: sum >= 12 ? "yes" : "no",
        hint: `From ${h12}, the 12 is ${12 - h12} ${plural(12 - h12)} away. Is the hop bigger than that?`,
        decoyQuestions: [
          "Is the new time before or after lunch?",
          "What hour does the hand stop on?",
        ],
      },
      {
        id: "half",
        input: "choice",
        ask: "So when it ends, is the time in the ☀️ half or the 🌙 half?",
        choices: halfChoices,
        answer: end.ampm,
        hint: flip
          ? `Passing the 12 means stepping across ${crossWord} on the day-line — the half flips from ${ampm === "a.m." ? "☀️ to 🌙" : "🌙 to ☀️"}.`
          : `The hand never passed the 12, so no ${crossWord} was crossed — the half stays the same as ${c(h12, ampm)}.`,
        decoyQuestions: [
          "How many hours did we add?",
          "What hour does the hand stop on?",
        ],
      },
      {
        id: "land",
        input: "clock-set",
        inputSpec: {
          kind: "clockFace",
          hour: end.h12,
          ampm: end.ampm === "a.m." ? "am" : "pm",
          ghostHour: h12,
          hops: add,
        },
        ask: `Now hop the hand ${add} ${plural(add)} from ${c(h12, ampm)}. What hour does it stop on?`,
        answer: end.h12,
        hint:
          sum > 12
            ? `Count the taps out loud — after 12 comes 1, the clock starts over by itself. ✨ Magic shortcut for when you're bigger: ${sum} is past 12, so you could also take 12 away.`
            : sum === 12
              ? `Count the taps — you land exactly on the 12 at the top.`
              : `Count the taps — you never reach the 12, so the hand just stops on the number.`,
        decoyQuestions: [
          "Is the new time before or after lunch?",
          "How many hours did we add?",
        ],
      },
    ];

    return {
      promptText: `Aoife starts ${act} at ${c(h12, ampm)} and it lasts ${add} ${plural(add)}. What time is it when it ends?`,
      figure: {
        kind: "clockFace",
        hour: h12,
        ampm: ampm === "a.m." ? "am" : "pm",
      },
      steps,
      finalAsk: "What hour does the clock show when it ends?",
      finalAnswers: [{ label: "o'clock", value: end.h12 }],
      data: {
        h12,
        add,
        sum,
        result: end.h12,
        flip: flip ? 1 : 0,
        isPm: ampm === "p.m." ? 1 : 0,
      },
    };
  },
};
