import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { activity: "swimming lesson", verb: "starts" },
  { activity: "art class", verb: "starts" },
  { activity: "soccer practice", verb: "starts" },
  { activity: "movie", verb: "starts" },
  { activity: "birthday party", verb: "starts" },
  { activity: "piano lesson", verb: "starts" },
];

// Format minutes-since-12 to "H:MM".
function fmt(total: number): string {
  const safe = Math.max(0, total);
  const hr = Math.floor(safe / 60);
  const min = safe % 60;
  return hr + ":" + String(min).padStart(2, "0");
}

export const timeElapsed: Framework = {
  id: "time-elapsed",
  title: "Time & Elapsed",
  emoji: "⏰",
  family: "Multi-Step & Real-World",
  blurb:
    "An activity starts at one time and runs for a while — ADD the minutes to find when it ends.",
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

    const startStr = fmt(startTotal);
    const endStr = fmt(endTotal);
    const tooLateStr = fmt(endTotal + 15);
    const tooEarlyStr = fmt(Math.max(0, endTotal - 15));

    // The two distractors differ from the answer by ±15 minutes, so they can
    // never equal the correct end string (and tooEarly stays well above 0).
    const endChoices = rng.shuffle([
      { label: endStr, value: endStr },
      { label: tooLateStr, value: tooLateStr },
      { label: tooEarlyStr, value: tooEarlyStr },
    ]);

    const steps: Step[] = [
      {
        id: "duration",
        input: "number",
        ask: "How many minutes long is the activity?",
        answer: dur,
        hint: `The problem tells you straight out — look for the word "lasts".`,
        decoyQuestions: [
          `What time does it start?`,
          `How many minutes are in an hour?`,
        ],
      },
      {
        id: "operation",
        input: "choice",
        ask: "What do you do with the start time and the minutes?",
        choices: [
          { label: "ADD the minutes to the start", value: "add" },
          { label: "SUBTRACT the minutes", value: "sub" },
        ],
        answer: "add",
        hint: `Time moves FORWARD while the activity runs, so the clock goes up.`,
        decoyQuestions: [
          `How many minutes long is the activity?`,
          `What time does it end? (don't guess yet!)`,
        ],
      },
      {
        id: "end",
        input: "choice",
        ask: "So what time does it end?",
        choices: endChoices,
        answer: endStr,
        hint: `Start at ${startStr} and count on ${dur} minutes (that's ${durSteps} quarter-hours).`,
        decoyQuestions: [
          `How many minutes long is the activity?`,
          `What time did it start?`,
        ],
      },
    ];

    return {
      promptText: `The ${s.activity} ${s.verb} at ${startStr} and lasts ${dur} minutes. What time does it end?`,
      steps,
      finalAsk: "What time does it end?",
      finalAnswers: [{ label: "how many minutes long", value: dur }],
      data: { startTotal, dur, endTotal },
    };
  },
};
