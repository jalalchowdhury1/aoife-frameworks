import { describe, it, expect } from "vitest";
import { byId, FRAMEWORKS, FAMILIES } from "./frameworks/index";
import { TIME_CHAPTERS, TIME_DAY } from "./frameworks/time-ladder";
import { makeRng } from "./rng";

// Heavy-duty audit sweep (2026-07-13): 3000 seeds per Time & Clocks framework,
// checking text sanity + the edge invariants the 500-seed contract doesn't.
const SEEDS = 3000;
const TIME_IDS = [
  "am-pm",
  "hop-hours",
  "past-noon",
  "clock-add",
  "clock-24",
  "time-difference",
  "time-zones",
  "chained-zones",
  "flight-zones",
];
const NUMERIC = new Set(["number", "clock-set", "line-hop"]);

describe("stress: time frameworks at 3000 seeds", () => {
  for (const id of TIME_IDS) {
    it(`${id}: text sane, structure sound, edges hold`, () => {
      const fw = byId(id)!;
      let crossed = 0;
      let figClock = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const p = fw.generate(makeRng(seed));
        // No broken interpolation anywhere the child can read.
        const texts = [
          p.promptText,
          p.finalAsk,
          ...p.steps.flatMap((s) => [s.ask, s.hint, ...s.decoyQuestions]),
          ...p.finalAnswers.map((f) => f.label),
          ...p.steps.flatMap((s) => (s.choices ?? []).map((c) => c.label)),
        ];
        for (const t of texts) {
          expect(t).not.toMatch(/undefined|NaN|null|\[object/);
        }
        // Chips: prompt always carries at least one time chip; chips well-formed.
        expect(p.promptText).toMatch(/\[\[\d{1,2}\|(am|pm)\]\]/);
        for (const t of texts) {
          const badChip = t.match(/\[\[(?!(\d{1,2})\|(am|pm)\]\])/);
          expect(badChip, `malformed chip in "${t}"`).toBeNull();
        }
        // Warm-up discipline: Days 2-9 open with exactly one warm-up, first.
        const warmups = p.steps.filter((s) => s.warmup);
        if (id === "am-pm") expect(warmups.length).toBe(0);
        else {
          expect(warmups.length).toBe(1);
          expect(p.steps[0].warmup).toBe(true);
        }
        // The last step is numeric-valued (engine contract) and interactive
        // steps always carry their inputSpec.
        const last = p.steps[p.steps.length - 1];
        expect(NUMERIC.has(last.input)).toBe(true);
        for (const s of p.steps) {
          if (s.input === "clock-set" || s.input === "line-hop") {
            expect(s.inputSpec, `${id} ${s.id} inputSpec`).toBeTruthy();
            expect(s.inputSpec!.hops).toBeGreaterThanOrEqual(1);
            // line-hop journeys must stay inside the 24-cell strip
            if (s.input === "line-hop") {
              const start = s.inputSpec!.start as number;
              const dir = (s.inputSpec!.dir as number) ?? 1;
              const hops = s.inputSpec!.hops as number;
              expect(start).toBeGreaterThanOrEqual(0);
              expect(start).toBeLessThanOrEqual(23);
              expect(start + dir * hops).toBeGreaterThanOrEqual(0);
              expect(start + dir * hops).toBeLessThanOrEqual(23);
            }
          }
        }
        // Framework-specific edge invariants.
        const d = p.data;
        if (id === "hop-hours") {
          // waking-day starts: mornings 7-8, afternoons end by 🛏️ 8 p.m.
          if (d.isPm === 0) expect(d.s).toBeGreaterThanOrEqual(7);
          else expect(d.s + d.k).toBeLessThanOrEqual(8);
        }
        if (id === "clock-add") {
          // waking-day starts: mornings 7-11 a.m., afternoons 1-7 p.m.
          if (d.isPm === 0) expect(d.h12).toBeGreaterThanOrEqual(7);
          else expect(d.h12).toBeLessThanOrEqual(7);
        }
        if (id === "past-noon") crossed += d.crossed;
        if (id === "time-zones") {
          figClock += d.fig;
          // any hop that would leave the strip must use the clock input
          const raw = d.a24 + (d.ahead === 1 ? d.offset : -d.offset);
          if (raw < 0 || raw > 23) expect(d.fig).toBe(1);
        }
      }
      // Distribution sanity: both past-noon variants actually occur.
      if (id === "past-noon") {
        expect(crossed).toBeGreaterThan(SEEDS * 0.5);
        expect(crossed).toBeLessThan(SEEDS * 0.95);
      }
      if (id === "time-zones") {
        expect(figClock).toBeGreaterThan(0);
        expect(figClock).toBeLessThan(SEEDS);
      }
    });
  }
});

describe("stress: whole registry", () => {
  it("every framework survives 1000 seeds with sane child-visible text", () => {
    for (const fw of FRAMEWORKS) {
      for (let seed = 1; seed <= 1000; seed++) {
        const p = fw.generate(makeRng(seed));
        const texts = [
          p.promptText,
          p.finalAsk,
          ...p.steps.flatMap((s) => [s.ask, s.hint, ...s.decoyQuestions]),
          ...p.finalAnswers.map((f) => f.label),
          ...p.steps.flatMap((s) => (s.choices ?? []).map((c) => String(c.label))),
        ];
        for (const t of texts) {
          expect(t, `${fw.id} @${seed}`).not.toMatch(/undefined|NaN|\[object/);
        }
        expect(FAMILIES).toContain(fw.family);
      }
    }
  });

  it("time-ladder metadata matches the registry exactly", () => {
    const ladderIds = TIME_CHAPTERS.flatMap((c) => [...c.ids]);
    const familyIds = FRAMEWORKS.filter((f) => f.family === "Time & Clocks").map((f) => f.id);
    expect([...ladderIds].sort()).toEqual([...familyIds].sort());
    expect(Object.keys(TIME_DAY).sort()).toEqual([...familyIds].sort());
    expect(ladderIds.map((id) => TIME_DAY[id])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
