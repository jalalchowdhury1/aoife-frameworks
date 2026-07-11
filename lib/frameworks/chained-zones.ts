import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, type AmPm } from "../clock";
import { warmupDirection, CITIES, halfChoices, c, plural } from "./time-shared";

// Day 8 · 🌍 Around the World — "Two Jumps, One Big Jump"
// ONE new idea: two hops (x forward, y back) squish into a single jump of
// x − y. After that it's exactly Day 7.
export const chainedZones: Framework = {
  id: "chained-zones",
  title: "Two Jumps, One Big Jump",
  emoji: "🧭",
  family: "Time & Clocks",
  blurb: "Hop forward, hop back — squish both into ONE jump, then it's easy.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.a24 + d.net) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return d.net === d.x - d.y && d.net >= 1 && d.result === h;
  },
  generate(rng: Rng): Problem {
    const [a, b, cc] = rng.shuffle([...CITIES]).slice(0, 3);
    const x = rng.int(2, 6); // B is x hours ahead of A
    const y = rng.int(1, x - 1); // C is y hours back from B
    const net = x - y; // C is net hours ahead of A (1..5)
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const aClock = { h12, ampm };
    const a24 = to24(h12, ampm);
    const cClock = addHours(aClock, net);

    const steps: Step[] = [
      warmupDirection(rng),
      {
        id: "net",
        input: "number",
        ask: `${b} is ${x} ${plural(x)} ahead of ${a}, and ${cc} is ${y} ${plural(y)} BACK from ${b}. Hop ${x} forward then ${y} back — how big is the ONE jump from ${a} to ${cc}?`,
        answer: net,
        hint: `Try it on the day-line: ${x} hops forward, ${y} hops back — you end up ${net} ahead. (That's ${x} − ${y}.)`,
        decoyQuestions: [
          `What time is it in ${b}?`,
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "half",
        input: "choice",
        ask: `After that jump, is it the ☀️ half or the 🌙 half in ${cc}?`,
        choices: halfChoices,
        answer: cClock.ampm,
        hint:
          cClock.ampm === ampm
            ? `The jump never crosses 🥪 lunch or 💤 midnight, so the half stays the same as ${c(h12, ampm)}.`
            : `The jump steps across ${ampm === "a.m." ? "🥪 lunch" : "💤 midnight"} — the half flips, just like Day 3.`,
        decoyQuestions: [
          `How big is the jump from ${a} to ${cc}?`,
          `What time is it in ${b}?`,
        ],
      },
      {
        id: "land",
        input: "clock-set",
        inputSpec: {
          kind: "clockFace",
          hour: cClock.h12,
          ampm: cClock.ampm === "a.m." ? "am" : "pm",
          ghostHour: h12,
          hops: net,
        },
        ask: `Hop the hand ${net} ${plural(net)} forward from ${c(h12, ampm)}. What hour does ${cc}'s clock show?`,
        answer: cClock.h12,
        hint: `Count the taps — after 12 comes 1, all by itself.`,
        decoyQuestions: [
          `Is it the ☀️ half or the 🌙 half in ${cc}?`,
          `What time is it in ${b}?`,
        ],
      },
    ];

    return {
      promptText: `${b} is ${x} ${plural(x)} ahead of ${a}. ${cc} is ${y} ${plural(y)} back from ${b}. When it is ${c(h12, ampm)} in ${a}, what time is it in ${cc}?`,
      figure: {
        kind: "clockFace",
        hour: h12,
        ampm: ampm === "a.m." ? "am" : "pm",
      },
      steps,
      finalAsk: `What hour does ${cc}'s clock show?`,
      finalAnswers: [{ label: `o'clock in ${cc}`, value: cClock.h12 }],
      data: { a24, x, y, net, result: cClock.h12 },
    };
  },
};
