import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, fmtClock, type AmPm } from "../clock";

const CITIES = ["Honolulu", "Denver", "New York", "London", "Moscow", "Singapore", "Auckland", "Berlin"];

// Q11: two offsets across three cities. Combine the two hops into ONE offset
// from the first city to the last, then convert the time just once.
export const chainedZones: Framework = {
  id: "chained-zones",
  title: "Chained Time Zones",
  emoji: "🧭",
  family: "Time & Clocks",
  blurb:
    "Three cities, two offsets — add them into a single jump, then convert the time once.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.a24 + d.net) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return d.net === d.x - d.y && d.net >= 1 && d.result === h;
  },
  generate(rng: Rng): Problem {
    const [a, b, c] = rng.shuffle(CITIES).slice(0, 3);
    const x = rng.int(2, 11); // B is x hours LATER than A
    const y = rng.int(1, x - 1); // C is y hours EARLIER than B
    const net = x - y; // so C is net hours later than A (1..10)
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const aClock = { h12, ampm };
    const a24 = to24(h12, ampm);
    const cClock = addHours(aClock, net);

    const steps: Step[] = [
      {
        id: "net",
        input: "number",
        ask: `${b} is ${x} hours ahead of ${a}, but ${c} is ${y} hour${y === 1 ? "" : "s"} back from ${b}. How many hours ahead of ${a} is ${c}? (${x} − ${y})`,
        answer: net,
        hint: `Go ${x} hours forward, then ${y} back: ${x} − ${y}.`,
        decoyQuestions: [
          `What time is it in ${b}?`,
          `Is ${c} ahead of or behind ${a}?`,
        ],
      },
      {
        id: "ampm",
        input: "choice",
        ask: `Adding ${net} hour${net === 1 ? "" : "s"} to ${fmtClock(aClock)}, is it a.m. or p.m. in ${c}?`,
        choices: [
          { label: "a.m.", value: "a.m." },
          { label: "p.m.", value: "p.m." },
        ],
        answer: cClock.ampm,
        hint: `${a} is ${fmtClock(aClock)}, and if you cross 12 (noon or midnight) the a.m./p.m. flips.`,
        decoyQuestions: [
          `How far ahead of ${a} is ${c}?`,
          `What time is it in ${b}?`,
        ],
      },
      {
        id: "result",
        input: "number",
        ask: `Count ${net} hour${net === 1 ? "" : "s"} forward from ${fmtClock(aClock)} — what hour does ${c}'s clock show?`,
        answer: cClock.h12,
        hint: `Move ${net} hours forward, taking 12 away if you pass it. It lands on ${cClock.h12} o'clock.`,
        decoyQuestions: [
          `Is it a.m. or p.m. in ${c}?`,
          `How far ahead of ${a} is ${c}?`,
        ],
      },
    ];

    return {
      promptText: `It is ${x} hours later in ${b} than in ${a}. It is ${y} hour${y === 1 ? "" : "s"} earlier in ${c} than in ${b}. If it is ${fmtClock(aClock)} in ${a}, what time is it in ${c}?`,
      steps,
      finalAsk: `What hour does ${c}'s clock show? (and is it a.m. or p.m.?)`,
      finalAnswers: [{ label: `o'clock in ${c}`, value: cClock.h12 }],
      data: { a24, x, y, net, result: cClock.h12 },
    };
  },
};
