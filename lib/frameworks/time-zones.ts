import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { to24, addHours, type AmPm } from "../clock";
import { warmupAhead, CITIES, halfChoices, c, plural } from "./time-shared";

// Day 7 · 🌍 Around the World — "Jump to Another City"
// Ahead = further along their day = hop FORWARD; behind = hop BACK. Then it's
// just Day 4's counting. The landing input is a clock (always safe across
// midnight) or a day-line hop when the hop stays inside the strip.
export const timeZones: Framework = {
  id: "time-zones",
  title: "Jump to Another City",
  emoji: "🌎",
  family: "Time & Clocks",
  blurb: "Ahead = hop forward, behind = hop back — then just count the hops.",
  source: "photo",
  invariant: (d) => {
    const r24 = (((d.a24 + (d.ahead === 1 ? d.offset : -d.offset)) % 24) + 24) % 24;
    const h = r24 % 12 === 0 ? 12 : r24 % 12;
    return d.result === h && d.offset >= 1 && d.offset <= 6 && (d.fig === 0 || d.fig === 1);
  },
  generate(rng: Rng): Problem {
    const [a, b] = rng.shuffle([...CITIES]).slice(0, 2);
    const offset = rng.int(1, 6);
    const ahead = rng.pick([true, false]);
    const ampm: AmPm = rng.pick(["a.m.", "p.m."]);
    const h12 = rng.int(1, 12);
    const aClock = { h12, ampm };
    const a24 = to24(h12, ampm);
    const bClock = addHours(aClock, ahead ? offset : -offset);
    const land24raw = a24 + (ahead ? offset : -offset);
    const wraps = land24raw < 0 || land24raw > 23;
    const fig = wraps ? 1 : rng.pick([0, 1]); // 0 = day-line, 1 = clock

    const inputSpec =
      fig === 0
        ? {
            kind: "dayLine",
            hopFrom: a24,
            hopTo: land24raw,
            start: a24,
            dir: ahead ? 1 : -1,
            hops: offset,
            mode: "land",
          }
        : {
            kind: "clockFace",
            hour: bClock.h12,
            ampm: bClock.ampm === "a.m." ? "am" : "pm",
            ghostHour: h12,
            dir: ahead ? 1 : -1,
            hops: offset,
          };

    const steps: Step[] = [
      warmupAhead(rng),
      {
        id: "dir",
        input: "choice",
        ask: `${b}'s clocks are ${offset} ${plural(offset)} ${ahead ? "AHEAD of" : "BEHIND"} ${a}'s. Which way do we hop to find ${b}'s time?`,
        choices: [
          { label: "⏩ forward (later)", value: "forward" },
          { label: "⏪ back (earlier)", value: "back" },
        ],
        answer: ahead ? "forward" : "back",
        hint: ahead
          ? `Ahead = further along their day = hop forward.`
          : `Behind = earlier in their day = hop back.`,
        decoyQuestions: [
          `What time is it in ${a}?`,
          "How many hours are in a whole day?",
        ],
      },
      {
        id: "half",
        input: "choice",
        ask: `After the hop, is it the ☀️ half or the 🌙 half in ${b}?`,
        choices: halfChoices,
        answer: bClock.ampm,
        hint:
          bClock.ampm === ampm
            ? `The hop never crosses 🥪 lunch or 💤 midnight, so the half stays the same as ${c(h12, ampm)}.`
            : `The hop steps across ${ampm === "a.m." ? (ahead ? "🥪 lunch" : "💤 midnight") : ahead ? "💤 midnight" : "🥪 lunch"} — watch the color change: the half flips.`,
        decoyQuestions: [
          "Which way do we hop?",
          `What time is it in ${a}?`,
        ],
      },
      {
        id: "land",
        input: fig === 0 ? "line-hop" : "clock-set",
        inputSpec,
        ask: `Hop ${offset} ${plural(offset)} ${ahead ? "forward ⏩" : "back ⏪"} from ${c(h12, ampm)}. What hour does ${b}'s clock show?`,
        answer: bClock.h12,
        hint: `Count each hop out loud — the ${fig === 0 ? "day-line" : "clock"} does the tricky part by itself.`,
        decoyQuestions: [
          "Which way do we hop?",
          `Is it the ☀️ half or the 🌙 half in ${b}?`,
        ],
      },
    ];

    return {
      promptText: `${b}'s clocks are ${offset} ${plural(offset)} ${ahead ? "AHEAD of" : "BEHIND"} ${a}'s. When it is ${c(h12, ampm)} in ${a}, what time is it in ${b}?`,
      figure:
        fig === 0
          ? { kind: "dayLine", highlight: a24 }
          : { kind: "clockFace", hour: h12, ampm: ampm === "a.m." ? "am" : "pm" },
      steps,
      finalAsk: `What hour does ${b}'s clock show?`,
      finalAnswers: [{ label: `o'clock in ${b}`, value: bClock.h12 }],
      data: {
        a24,
        offset,
        ahead: ahead ? 1 : 0,
        result: bClock.h12,
        fig,
      },
    };
  },
};
