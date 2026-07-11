import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, type AmPm } from "../clock";
import { warmupCombine, CITIES, halfChoices, c, plural } from "./time-shared";

// Day 9 · 🌍 Around the World — "Aoife Flies Away" (capstone)
// Flight hours AND a zone jump, squished into one big jump (Day 8's move),
// then hop the clock (Day 4's move). Every single day gets used.
export const flightZones: Framework = {
  id: "flight-zones",
  title: "Aoife Flies Away",
  emoji: "✈️",
  family: "Time & Clocks",
  blurb: "The grand finale — a real flight, a zone jump, and every trick you've learned.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.dep24 + d.net) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return (
      d.net === (d.later === 1 ? d.dur + d.off : d.dur - d.off) &&
      d.net >= 1 &&
      d.result === h
    );
  },
  generate(rng: Rng): Problem {
    const arr = rng.pick(CITIES.filter((city) => city !== "Dublin"));
    const dur = rng.int(3, 7);
    const later = rng.pick([true, false]);
    const off = later ? rng.int(1, 4) : rng.int(1, dur - 1);
    const net = later ? dur + off : dur - off;
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const depClock = { h12, ampm };
    const dep24 = to24(h12, ampm);
    const landClock = addHours(depClock, net);

    const steps: Step[] = [
      warmupCombine(rng),
      {
        id: "net",
        input: "number",
        ask: `The flight takes ${dur} ${plural(dur)}, AND ${arr}'s clocks are ${off} ${plural(off)} ${later ? "AHEAD" : "BEHIND"}. Squish both into ONE jump — how many hours does the clock jump in all?`,
        answer: net,
        hint: later
          ? `Two jumps forward: ${dur} for flying plus ${off} for the zone — count them together on the day-line.`
          : `${dur} forward for flying, then ${off} back for the zone — just like yesterday: ${dur} − ${off}.`,
        decoyQuestions: [
          `What time does the plane leave Dublin?`,
          "Is it the ☀️ half or the 🌙 half when it lands?",
        ],
      },
      {
        id: "half",
        input: "choice",
        ask: `When the plane lands in ${arr}, is it the ☀️ half or the 🌙 half there?`,
        choices: halfChoices,
        answer: landClock.ampm,
        hint:
          landClock.ampm === ampm
            ? `The big jump never crosses 🥪 lunch or 💤 midnight — the half stays the same as take-off, ${c(h12, ampm)}.`
            : `Somewhere over the ocean the jump crosses ${ampm === "a.m." ? "🥪 lunch" : "💤 midnight"} — the half flips, just like Day 3.`,
        decoyQuestions: [
          "How many hours does the clock jump in all?",
          `What time does the plane leave Dublin?`,
        ],
      },
      {
        id: "land",
        input: "clock-set",
        inputSpec: {
          kind: "clockFace",
          hour: landClock.h12,
          ampm: landClock.ampm === "a.m." ? "am" : "pm",
          ghostHour: h12,
          hops: net,
        },
        ask: `Hop the hand ${net} ${plural(net)} from take-off at ${c(h12, ampm)}. What hour does ${arr}'s clock show when Aoife lands?`,
        answer: landClock.h12,
        hint: `Count the taps out loud — after 12 comes 1, all by itself. You've done this every single day! 🐇`,
        decoyQuestions: [
          "Is it the ☀️ half or the 🌙 half when it lands?",
          "How many hours does the clock jump in all?",
        ],
      },
    ];

    return {
      promptText: `The grand finale! ✈️ Aoife and her family fly from Dublin to ${arr}. The flight takes ${dur} ${plural(dur)}, and ${arr}'s clocks are ${off} ${plural(off)} ${later ? "AHEAD of" : "BEHIND"} Dublin's. The plane takes off at ${c(h12, ampm)}. What time is it in ${arr} when they land?`,
      figure: {
        kind: "clockFace",
        hour: h12,
        ampm: ampm === "a.m." ? "am" : "pm",
      },
      steps,
      finalAsk: `What hour does ${arr}'s clock show when Aoife lands?`,
      finalAnswers: [{ label: `o'clock in ${arr}`, value: landClock.h12 }],
      data: {
        dep24,
        dur,
        off,
        later: later ? 1 : 0,
        net,
        result: landClock.h12,
      },
    };
  },
};
