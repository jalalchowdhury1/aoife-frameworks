import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { type AmPm } from "../clock";
import { warmupClockAdd, c } from "./time-shared";

// Day 5 · 🏠 Aoife's Day — "The Keep-Counting Clock"
// Some clocks don't start over after lunch — they keep counting: 12, 13, 14…
// She READS the 24-hour time off the day-line's bottom number row (hopping
// from 🥪 lunch for p.m., from 💤 midnight for a.m.). The "+12" is only a
// ✨ magic shortcut in the hint.
export const clock24: Framework = {
  id: "clock-24",
  title: "The Keep-Counting Clock",
  emoji: "🕓",
  family: "Time & Clocks",
  blurb: "Some clocks keep counting past 12 — find the time, read the bottom number.",
  source: "photo",
  invariant: (d) =>
    (d.isPm === 1 ? d.result === d.h12 + 12 : d.result === d.h12) &&
    d.h12 >= 1 &&
    d.h12 <= 11,
  generate(rng: Rng): Problem {
    const isPm = rng.int(1, 4) <= 3; // mostly p.m. — that's where the idea lives
    const ampm: AmPm = isPm ? "p.m." : "a.m.";
    const h12 = rng.int(1, 11);
    const result = isPm ? h12 + 12 : h12;
    const startCell = isPm ? 12 : 0; // hop from 🥪 lunch (p.m.) or 💤 midnight (a.m.)

    const steps: Step[] = [
      warmupClockAdd(rng),
      {
        id: "read",
        input: "line-hop",
        inputSpec: {
          kind: "dayLine",
          variant: "double",
          start: startCell,
          hops: h12,
          mode: "land",
          row: "h24",
        },
        ask: isPm
          ? `Hop from 🥪 lunch to ${c(h12, ampm)} on the day-line. What number is written UNDER it — what does the keep-counting clock say?`
          : `Hop from 💤 midnight to ${c(h12, ampm)} on the day-line. What number is written UNDER it — what does the keep-counting clock say?`,
        answer: result,
        hint: isPm
          ? `After 🥪 lunch the bottom row keeps counting: 12, 13, 14… Count ${h12} past 12 and read the number. ✨ Magic shortcut for when you're bigger: after lunch you can just add 12.`
          : `Before lunch the two rows MATCH — the keep-counting clock says the same ${h12}.`,
        decoyQuestions: [
          "Is the time before or after lunch?",
          "How many hours are in a whole day?",
        ],
      },
    ];

    return {
      promptText: `Some clocks never start over after lunch — they keep counting: ${c(1, "p.m.")} becomes 13, ${c(2, "p.m.")} becomes 14… What does the keep-counting clock say at ${c(h12, ampm)}?`,
      // No highlight — finding the cell (and reading under it) IS the task.
      figure: {
        kind: "dayLine",
        variant: "double",
      },
      steps,
      finalAsk: "What does the keep-counting clock say?",
      finalAnswers: [{ label: "on the keep-counting clock", value: result }],
      data: { h12, isPm: isPm ? 1 : 0, result },
    };
  },
};
