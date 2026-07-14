import { describe, it, expect } from "vitest";
import { FRAMEWORKS } from "./index";
import { makeRng } from "../rng";

// Steps whose answers are numbers: the plain numpad plus the two interactive
// Time & Clocks inputs (she submits an hour / a hop count — same semantics).
const NUMERIC = new Set(["number", "clock-set", "line-hop"]);

describe("every framework generator", () => {
  for (const fw of FRAMEWORKS) {
    it(`${fw.id}: 500 solvable, consistent problems`, () => {
      for (let seed = 1; seed <= 500; seed++) {
        const p = fw.generate(makeRng(seed));
        expect(p.steps.length, `${fw.id} has steps`).toBeGreaterThan(0);
        expect(p.finalAnswers.length).toBeGreaterThan(0);
        expect(p.promptText.length).toBeGreaterThan(0);
        expect(p.finalAsk.length).toBeGreaterThan(0);
        for (const s of p.steps) {
          if (NUMERIC.has(s.input)) {
            const v = s.answer as number;
            expect(Number.isInteger(v) && v >= 0, `${fw.id} step ${s.id}=${v}`).toBe(true);
          }
          if (s.input === "choice") {
            expect(s.choices && s.choices.length >= 2, `${fw.id} ${s.id} choices`).toBe(true);
            expect(
              s.choices!.some((c) => c.value === s.answer),
              `${fw.id} ${s.id} answer is a choice`,
            ).toBe(true);
          }
          // Lead needs at least 2 decoys, none equal to the real question
          expect(s.decoyQuestions.length, `${fw.id} ${s.id} decoys`).toBeGreaterThanOrEqual(2);
          expect(s.decoyQuestions).not.toContain(s.ask);
          expect(s.hint.length, `${fw.id} ${s.id} hint`).toBeGreaterThan(0);
          // A "What is A op B?" decoy must NOT evaluate to a real answer in this
          // problem (this step's answer, or any final answer) — otherwise the
          // wrong question rewards/teaches the wrong arithmetic. Guards the whole
          // "decoy-correct" class found in the 2026-06-10 audit.
          // ...compared against EVERY numeric answer in the problem, not just
          // this step's — a decoy computing a sibling step's answer teaches the
          // wrong move too (widened 2026-07-15).
          const realValues = new Set<number>([
            ...p.steps.filter((st) => NUMERIC.has(st.input)).map((st) => st.answer as number),
            ...p.finalAnswers.map((fa) => fa.value),
          ]);
          for (const decoy of s.decoyQuestions) {
            const m = decoy.match(/What is (\d+) ([+−\-×x*÷/]) (\d+)\?/);
            if (!m) continue;
            const a = Number(m[1]);
            const b = Number(m[3]);
            const op = m[2];
            const val =
              op === "+" ? a + b
              : op === "×" || op === "x" || op === "*" ? a * b
              : op === "÷" || op === "/" ? (b !== 0 ? a / b : NaN)
              : a - b; // − or -
            expect(
              !realValues.has(val),
              `${fw.id} ${s.id} decoy "${decoy}" = ${val} equals a real answer @${seed}`,
            ).toBe(true);
          }
        }
        // The question-script must actually REACH every final answer: each
        // finalAnswer.value has to be the answer of some number step (otherwise
        // the child is walked through a script that never computes the answer).
        const numberStepAnswers = new Set(
          p.steps.filter((s) => NUMERIC.has(s.input)).map((s) => s.answer as number),
        );
        for (const fa of p.finalAnswers) {
          expect(
            Number.isInteger(fa.value) && fa.value >= 0,
            `${fw.id} final ${fa.label}=${fa.value}`,
          ).toBe(true);
          expect(
            numberStepAnswers.has(fa.value),
            `${fw.id} final ${fa.label}=${fa.value} is never derived by a step @${seed}`,
          ).toBe(true);
        }
        // The script must END on an answer: the last step's answer is a final answer.
        const last = p.steps[p.steps.length - 1];
        expect(
          p.finalAnswers.some((fa) => fa.value === last.answer),
          `${fw.id} last step "${last.id}" (=${String(last.answer)}) is not a final answer @${seed}`,
        ).toBe(true);
        // framework-specific truth
        expect(fw.invariant(p.data), `${fw.id} invariant @${seed}`).toBe(true);
      }
    });
  }
  // A choice step whose correct button sits at the same position on every
  // seed lets the child pattern-match position instead of reading. Every
  // choice-step id must move its answer around (or the options themselves
  // must vary the answer) across seeds.
  it("no choice step keeps its answer at a fixed position across all seeds", () => {
    const violations: string[] = [];
    for (const fw of FRAMEWORKS) {
      const indexesByStep = new Map<string, Set<number>>();
      const seen = new Map<string, number>();
      for (let seed = 1; seed <= 500; seed++) {
        const p = fw.generate(makeRng(seed));
        for (const s of p.steps) {
          if (s.input !== "choice" || !s.choices) continue;
          const idx = s.choices.findIndex((c) => c.value === s.answer);
          if (!indexesByStep.has(s.id)) indexesByStep.set(s.id, new Set());
          indexesByStep.get(s.id)!.add(idx);
          seen.set(s.id, (seen.get(s.id) ?? 0) + 1);
        }
      }
      for (const [stepId, idxs] of indexesByStep) {
        if ((seen.get(stepId) ?? 0) < 50) continue; // rare variants — not enough signal
        if (idxs.size < 2) violations.push(`${fw.id} step "${stepId}" (always choice #${[...idxs][0]})`);
      }
    }
    expect(violations, `shuffle the choices in: ${violations.join(", ")}`).toEqual([]);
  });

  it("registry has 32 unique ids", () => {
    expect(FRAMEWORKS.length).toBe(32);
    expect(new Set(FRAMEWORKS.map((f) => f.id)).size).toBe(32);
  });
});
