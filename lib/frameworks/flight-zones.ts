import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, fmtClock, type AmPm } from "../clock";

const CITIES = ["Honolulu", "Denver", "New York", "London", "Moscow", "Singapore", "Seattle", "Auckland"];

// Q12 capstone: flight duration AND a zone offset together. The clock change from
// takeoff to landing is the flight time, plus (or minus) the zone difference.
export const flightZones: Framework = {
  id: "flight-zones",
  title: "Flight + Time Zones",
  emoji: "✈️",
  family: "Time & Clocks",
  blurb:
    "A plane's flight time AND a time-zone change at once — add them up, then read the landing clock.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.dep24 + d.net) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return d.net === (d.later ? d.dur + d.off : d.dur - d.off) && d.net >= 1 && d.result === h;
  },
  generate(rng: Rng): Problem {
    const [dep, arr] = rng.shuffle(CITIES).slice(0, 2);
    const dur = rng.int(3, 9);
    const later = rng.pick([true, false]);
    const off = later ? rng.int(1, 6) : rng.int(1, dur - 1);
    const net = later ? dur + off : dur - off;
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const depClock = { h12, ampm };
    const dep24 = to24(h12, ampm);
    const landClock = addHours(depClock, net);

    const steps: Step[] = [
      {
        id: "net",
        input: "number",
        ask: `The flight takes ${dur} hours. ${arr} is ${off} hour${off === 1 ? "" : "s"} ${later ? "later" : "earlier"} than ${dep}, so the clock changes by ${dur} ${later ? "+" : "−"} ${off}. How many hours is that?`,
        answer: net,
        hint: later
          ? `Flight time plus the zone jump forward: ${dur} + ${off}.`
          : `Flight time, but the zone is earlier so take it off: ${dur} − ${off}.`,
        decoyQuestions: [
          `What time does the plane leave ${dep}?`,
          `Is it a.m. or p.m. when it lands?`,
        ],
      },
      {
        id: "ampm",
        input: "choice",
        ask: `Adding ${net} hour${net === 1 ? "" : "s"} to ${fmtClock(depClock)}, is it a.m. or p.m. when it lands in ${arr}?`,
        choices: [
          { label: "a.m.", value: "a.m." },
          { label: "p.m.", value: "p.m." },
        ],
        answer: landClock.ampm,
        hint: `It leaves at ${fmtClock(depClock)}, and if you cross 12 (noon or midnight) the a.m./p.m. flips.`,
        decoyQuestions: [
          "How many hours does the clock change by?",
          `What time does the plane leave ${dep}?`,
        ],
      },
      {
        id: "result",
        input: "number",
        ask: `Count ${net} hour${net === 1 ? "" : "s"} forward from ${fmtClock(depClock)} — what hour does ${arr}'s clock show when it lands?`,
        answer: landClock.h12,
        hint: `Move ${net} hours forward, taking 12 away if you pass it. It lands on ${landClock.h12} o'clock.`,
        decoyQuestions: [
          "Is it a.m. or p.m. when it lands?",
          "How many hours does the clock change by?",
        ],
      },
    ];

    return {
      promptText: `A flight from ${dep} to ${arr} takes ${dur} hours. ${arr} is ${off} hour${off === 1 ? "" : "s"} ${later ? "later" : "earlier"} than ${dep}. The flight leaves ${dep} at ${fmtClock(depClock)} — what time is it in ${arr} when it lands?`,
      steps,
      finalAsk: `What hour does ${arr}'s clock show when it lands?`,
      finalAnswers: [{ label: `o'clock in ${arr}`, value: landClock.h12 }],
      data: { dep24, dur, off, later: later ? 1 : 0, net, result: landClock.h12 },
    };
  },
};
