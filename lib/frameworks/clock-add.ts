import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { addHours, crossesTwelve, fmtClock, type AmPm } from "../clock";

const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];
const ACTS = ["the bake sale", "the long car trip", "the sleepover", "the boat ride", "the camping trip"];

// The wrap-past-12 mechanic every time-zone puzzle reuses: add hours, take 12
// away if you go past it, and flip a.m./p.m. when you cross noon or midnight.
export const clockAdd: Framework = {
  id: "clock-add",
  title: "Clock Add",
  emoji: "🕒",
  family: "Time & Clocks",
  blurb:
    "Add hours to a clock time — pass 12 and you take 12 away and flip a.m./p.m.",
  source: "added",
  invariant: (d) =>
    d.result === (d.sum > 12 ? d.sum - 12 : d.sum) &&
    d.sum === d.h12 + d.add &&
    (d.flip === 1) === d.sum >= 12,
  generate(rng: Rng): Problem {
    const name = rng.pick(NAMES);
    const act = rng.pick(ACTS);
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 11); // avoid a 12 start to keep the wrap clean
    const add = rng.int(1, 8);
    const start = { h12, ampm };
    const sum = h12 + add;
    const end = addHours(start, add);
    const flip = crossesTwelve(start, add);
    const result = end.h12;

    const steps: Step[] = [
      {
        id: "sum",
        input: "number",
        ask: `Start at ${h12} o'clock and count on ${add} hours: ${h12} + ${add}`,
        answer: sum,
        hint: `Just add the hours to the start hour: ${h12} + ${add}.`,
        decoyQuestions: [
          "Is the new time a.m. or p.m.?",
          "What hour does the clock show in the end?",
        ],
      },
      {
        id: "pass12",
        input: "choice",
        ask: `Does the clock reach or go past 12 o'clock? (is ${sum} bigger than 12, or equal to 12?)`,
        choices: [
          { label: "Yes — it reaches/passes 12", value: "yes" },
          { label: "No — it stays under 12", value: "no" },
        ],
        answer: sum >= 12 ? "yes" : "no",
        hint: `Compare ${sum} with 12. Reaching 12 means you hit noon or midnight.`,
        decoyQuestions: [
          "How many hours did we add?",
          "What hour does the clock show in the end?",
        ],
      },
      {
        id: "ampm",
        input: "choice",
        ask: "Is the new time a.m. or p.m.?",
        choices: [
          { label: "a.m.", value: "a.m." },
          { label: "p.m.", value: "p.m." },
        ],
        answer: end.ampm,
        hint: flip
          ? `You crossed 12 (noon or midnight), so a.m./p.m. FLIPS — it started ${ampm}.`
          : `You did NOT cross 12, so a.m./p.m. stays the same — it started ${ampm}.`,
        decoyQuestions: [
          "How many hours did we add?",
          "Did the clock pass 12 o'clock?",
        ],
      },
      {
        id: "result",
        input: "number",
        ask:
          sum > 12
            ? `You passed 12, so take 12 away to read the clock: ${sum} − 12`
            : sum === 12
              ? `You landed right on 12 o'clock. What hour does the clock show?`
              : `You stayed under 12, so the clock just shows that hour. What hour is it?`,
        answer: result,
        hint:
          sum > 12
            ? `Past 12, so subtract 12: ${sum} − 12.`
            : sum === 12
              ? `Landing on 12 means it's 12 o'clock — noon or midnight.`
              : `No wrap needed — it's still ${sum} o'clock.`,
        decoyQuestions: [
          "Is the new time a.m. or p.m.?",
          "How many hours did we add?",
        ],
      },
    ];

    return {
      promptText: `${name} starts ${act} at ${fmtClock(start)} and it lasts ${add} hour${add === 1 ? "" : "s"}. What time is it when it ends?`,
      steps,
      finalAsk: "What hour does the clock show when it ends?",
      finalAnswers: [{ label: "o'clock", value: result }],
      data: { h12, add, sum, result, flip: flip ? 1 : 0 },
    };
  },
};
