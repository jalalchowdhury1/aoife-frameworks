import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, fmtClock, type AmPm } from "../clock";

const CITIES = ["Honolulu", "Denver", "New York", "London", "Moscow", "Singapore", "Auckland", "Seattle"];

// Q8 (part 2): given the offset and direction, convert a specific time from one
// city to another. Reuses the Clock Add wrap mechanic (ahead = add, behind = subtract).
export const timeZones: Framework = {
  id: "time-zones",
  title: "Convert Across Time Zones",
  emoji: "🌎",
  family: "Time & Clocks",
  blurb:
    "Ahead means add the hours, behind means subtract — then read the new clock, watching for a.m./p.m.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.a24 + (d.ahead ? d.offset : -d.offset)) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return d.result === h && d.offset >= 1 && d.offset <= 11;
  },
  generate(rng: Rng): Problem {
    const [a, b] = rng.shuffle(CITIES).slice(0, 2);
    const offset = rng.int(1, 11);
    const ahead = rng.pick([true, false]);
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const aClock = { h12, ampm };
    const a24 = to24(h12, ampm);
    const bClock = addHours(aClock, ahead ? offset : -offset);

    const steps: Step[] = [
      {
        id: "dir",
        input: "choice",
        ask: `${b} is ${offset} hour${offset === 1 ? "" : "s"} ${ahead ? "ahead of" : "behind"} ${a}. Do we ADD or SUBTRACT those hours?`,
        choices: [
          { label: "Add the hours", value: "add" },
          { label: "Subtract the hours", value: "subtract" },
        ],
        answer: ahead ? "add" : "subtract",
        hint: ahead
          ? "Ahead means later, so we ADD the hours."
          : "Behind means earlier, so we SUBTRACT the hours.",
        decoyQuestions: [
          `What time is it in ${a}?`,
          "How many hours apart are the cities?",
        ],
      },
      {
        id: "ampm",
        input: "choice",
        ask: `After ${ahead ? "adding" : "subtracting"} ${offset} hour${offset === 1 ? "" : "s"} from ${fmtClock(aClock)}, is it a.m. or p.m. in ${b}?`,
        choices: [
          { label: "a.m.", value: "a.m." },
          { label: "p.m.", value: "p.m." },
        ],
        answer: bClock.ampm,
        hint: `${a} is ${fmtClock(aClock)}, and if you cross 12 (noon or midnight) the a.m./p.m. flips.`,
        decoyQuestions: [
          "Do we add or subtract the hours?",
          `What time is it in ${a}?`,
        ],
      },
      {
        id: "result",
        input: "number",
        ask: `Count ${offset} hour${offset === 1 ? "" : "s"} ${ahead ? "forward" : "back"} from ${fmtClock(aClock)} — what hour does ${b}'s clock show?`,
        answer: bClock.h12,
        hint: `Move ${offset} hour${offset === 1 ? "" : "s"} ${ahead ? "forward" : "back"} on the clock, taking 12 away if you pass it. It lands on ${bClock.h12} o'clock.`,
        decoyQuestions: [
          "Is it a.m. or p.m. now?",
          "Do we add or subtract the hours?",
        ],
      },
    ];

    return {
      promptText: `${b} is ${offset} hour${offset === 1 ? "" : "s"} ${ahead ? "ahead of" : "behind"} ${a}. When it is ${fmtClock(aClock)} in ${a}, what time is it in ${b}?`,
      steps,
      finalAsk: `What hour does ${b}'s clock show? (and is it a.m. or p.m.?)`,
      finalAnswers: [{ label: `o'clock in ${b}`, value: bClock.h12 }],
      data: { a24, offset, ahead: ahead ? 1 : 0, result: bClock.h12 },
    };
  },
};
