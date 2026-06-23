import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { type AmPm } from "../clock";

// Q13: the 24-hour clock. Morning hours stay the same; afternoon/night hours get
// 12 added (1 p.m. = 13:00, 6 p.m. = 18:00).
export const clock24: Framework = {
  id: "clock-24",
  title: "24-Hour Clock",
  emoji: "🕓",
  family: "Time & Clocks",
  blurb:
    "Some countries count hours up to 24. a.m. hours stay the same; p.m. hours add 12.",
  source: "photo",
  invariant: (d) =>
    (d.isPm === 1 ? d.result === d.h12 + 12 : d.result === d.h12) &&
    d.h12 >= 1 &&
    d.h12 <= 11,
  generate(rng: Rng): Problem {
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const isPm = ampm === "p.m.";
    const h12 = rng.int(1, 11);
    const result = isPm ? h12 + 12 : h12;

    const steps: Step[] = [
      {
        id: "ampm",
        input: "choice",
        ask: `Is ${h12}:00 ${ampm} in the morning (a.m.) or afternoon/night (p.m.)?`,
        choices: [
          { label: "a.m. (morning)", value: "a.m." },
          { label: "p.m. (afternoon / night)", value: "p.m." },
        ],
        answer: ampm,
        hint: `The problem already tells you: it says ${ampm}`,
        decoyQuestions: [
          "What is the hour in 24-hour time?",
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "result",
        input: "number",
        ask: isPm
          ? `It's p.m., so add 12 to the hour: ${h12} + 12`
          : `It's a.m., so the 24-hour time uses the SAME hour. What is it?`,
        answer: result,
        hint: isPm
          ? `Afternoon and night hours add 12: ${h12} + 12.`
          : `Morning hours don't change: it stays ${h12}.`,
        decoyQuestions: [
          "Is the time a.m. or p.m.?",
          "How many hours are in a whole day?",
        ],
      },
    ];

    return {
      promptText: `In 24-hour time, 1:00 p.m. is written 13:00. What is ${h12}:00 ${ampm} in 24-hour time?`,
      steps,
      finalAsk: "What is the hour in 24-hour time?",
      finalAnswers: [{ label: "in 24-hour time", value: result }],
      data: { h12, isPm: isPm ? 1 : 0, result },
    };
  },
};
