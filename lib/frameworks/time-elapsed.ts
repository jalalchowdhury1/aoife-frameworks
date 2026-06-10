import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { activity: "swimming lesson" },
  { activity: "art class" },
  { activity: "soccer practice" },
  { activity: "movie" },
  { activity: "birthday party" },
  { activity: "piano lesson" },
];

// Format minutes-since-12 to "H:MM".
function fmt(total: number): string {
  const hr = Math.floor(total / 60);
  const min = total % 60;
  return hr + ":" + String(min).padStart(2, "0");
}

export const timeElapsed: Framework = {
  id: "time-elapsed",
  title: "Time & Elapsed",
  emoji: "⏰",
  family: "Multi-Step & Real-World",
  blurb:
    "An activity starts at one clock time and ends at another — change both to minutes, then subtract to find how long.",
  source: "added",
  invariant: (d) => d.startTotal + d.dur === d.endTotal,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const startHr = rng.int(1, 8);
    const startMin = rng.pick([0, 15, 30, 45]);
    const durSteps = rng.int(1, 8);
    const dur = durSteps * 15;
    const startTotal = startHr * 60 + startMin;
    const endTotal = startTotal + dur; // stays < 720
    const endHr = Math.floor(endTotal / 60);
    const endMin = endTotal % 60;

    const startStr = fmt(startTotal);
    const endStr = fmt(endTotal);

    const steps: Step[] = [
      {
        id: "startMinutes",
        input: "number",
        ask: `Change the START time to minutes (hours × 60 + minutes): ${startHr} × 60 + ${startMin}`,
        answer: startTotal,
        hint: `${startHr === 1 ? "1 hour" : `${startHr} hours`} is ${startHr} × 60 = ${startHr * 60} minutes, then add the ${startMin}: ${startHr * 60} + ${startMin}.`,
        decoyQuestions: [`What is ${startHr} + ${startMin}?`, `What time does it end?`],
      },
      {
        id: "endMinutes",
        input: "number",
        ask: `Change the END time to minutes: ${endHr} × 60 + ${endMin}`,
        answer: endTotal,
        hint: `${endHr === 1 ? "1 hour" : `${endHr} hours`} is ${endHr} × 60 = ${endHr * 60} minutes, then add the ${endMin}: ${endHr * 60} + ${endMin}.`,
        decoyQuestions: [`What is ${endHr} + ${endMin}?`, `What time does it start?`],
      },
      {
        id: "elapsed",
        input: "number",
        ask: `How long is it? END minutes − START minutes: ${endTotal} − ${startTotal}`,
        answer: dur,
        hint: `Take the start away from the end: ${endTotal} − ${startTotal}.`,
        decoyQuestions: [
          `What is ${endTotal} + ${startTotal}?`,
          `What time does it start?`,
        ],
      },
    ];

    return {
      promptText: `The ${s.activity} starts at ${startStr} and ends at ${endStr}. How many minutes long is it?`,
      steps,
      finalAsk: "How many minutes long is it?",
      finalAnswers: [{ label: "minutes long", value: dur }],
      data: { startTotal, dur, endTotal },
    };
  },
};
