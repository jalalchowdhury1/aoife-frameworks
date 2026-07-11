import { describe, it, expect } from "vitest";
import { byId } from "../frameworks/index";
import { makeRng } from "../rng";
import type { Problem } from "../types";

// Figures are part of the information shown to the child — their numbers must
// match the generated problem exactly. One block per figure-bearing framework.

const SEEDS = 300;

function each(id: string, fn: (p: Problem, seed: number) => void) {
  const fw = byId(id);
  expect(fw, `${id} registered`).toBeTruthy();
  for (let seed = 1; seed <= SEEDS; seed++) fn(fw!.generate(makeRng(seed)), seed);
}

interface Bar {
  label: string;
  value: number;
  known: boolean;
}

describe("figure data matches problem data", () => {
  it("equal-groups: dotArray rows×cols = total (multiply variant only)", () => {
    each("equal-groups", (p) => {
      const isShare = p.promptText.includes("shared equally");
      if (isShare) {
        // Division variant deliberately has no array — it would reveal the answer.
        expect(p.figure).toBeUndefined();
        return;
      }
      const f = p.figure!;
      expect(f.kind).toBe("dotArray");
      expect(f.rows).toBe(p.data.groups);
      expect(f.cols).toBe(p.data.each);
      expect((f.rows as number) * (f.cols as number)).toBe(p.data.total);
    });
  });

  it("fenceposts: postRow posts & spacing match", () => {
    each("fenceposts", (p) => {
      const f = p.figure!;
      expect(f.kind).toBe("postRow");
      expect(f.posts).toBe(p.data.posts);
      expect(f.spacing).toBe(p.data.s);
      expect(p.promptText).toContain(`${p.data.s} ${f.unit} apart`);
      expect(p.promptText).toContain(`${p.data.D} ${f.unit}`);
    });
  });

  it("more-fewer: bars show big and small", () => {
    each("more-fewer", (p) => {
      const bars = p.figure!.bars as Bar[];
      expect(bars.map((b) => b.value)).toEqual([p.data.big, p.data.small]);
      expect(bars.every((b) => b.known)).toBe(true);
    });
  });

  it("part-part-whole: bars show whole, known part, unknown part", () => {
    each("part-part-whole", (p) => {
      const bars = p.figure!.bars as Bar[];
      expect(bars.map((b) => b.value)).toEqual([p.data.whole, p.data.partA, p.data.partB]);
      expect(bars.map((b) => b.known)).toEqual([true, true, false]);
    });
  });

  it("compare-bar: bars show bigger and smaller, both unknown", () => {
    each("compare-bar", (p) => {
      const bars = p.figure!.bars as Bar[];
      expect(bars.map((b) => b.value)).toEqual([p.data.bigger, p.data.smaller]);
      expect(bars.every((b) => !b.known)).toBe(true);
    });
  });

  it("number-bonds: circles/squares blanks match what is asked", () => {
    each("number-bonds", (p) => {
      const f = p.figure!;
      expect(f.kind).toBe("numberBond");
      expect(f.circles).toEqual([p.data.c1, p.data.c2, null]); // c3 hidden
      expect(f.squares).toEqual([null, p.data.s2]); // s1 hidden
      // The hidden cells are exactly the final answers.
      expect(p.finalAnswers.map((a) => a.value)).toEqual([p.data.s1, p.data.c3]);
    });
  });

  it("patterns-rules: sequence terms follow the rule, last term blank", () => {
    each("patterns-rules", (p) => {
      const terms = p.figure!.terms as (number | null)[];
      expect(terms).toHaveLength(5);
      expect(terms[4]).toBeNull();
      expect(terms[3]).toBe(p.data.t3);
      for (let i = 1; i <= 3; i++) {
        const prev = terms[i - 1] as number;
        const cur = terms[i] as number;
        if (p.data.isMul === 1) expect(cur).toBe(prev * 2);
        else expect(cur - prev).toBe(p.data.step);
      }
      // The blank continues the rule.
      const expectedNext = p.data.isMul === 1 ? p.data.t3 * 2 : p.data.t3 + p.data.step;
      expect(p.data.t4).toBe(expectedNext);
    });
  });

  it("cross-number-grid: grid cells are arithmetically consistent, blanks are the answers", () => {
    each("cross-number-grid", (p) => {
      const cells = p.figure!.cells as (number | string | null)[][];
      const d = p.data;
      expect(cells[0]).toEqual([d.a, "+", d.b, "=", null]); // c blanked
      expect(cells[2]).toEqual([d.d, "+", d.e, "=", d.f]);
      expect(cells[4]).toEqual([null, "+", d.h, "=", d.i]); // g blanked
      expect(d.c).toBe(d.a + d.b);
      expect(d.f).toBe(d.d + d.e);
      expect(d.g).toBe(d.a + d.d);
      expect(d.h).toBe(d.b + d.e);
      expect(d.i).toBe(d.c + d.f);
      expect(p.finalAnswers.map((a) => a.value)).toEqual([d.c, d.g]);
    });
  });

  it("am-pm: dayLine event icons sit at the problem's hours", () => {
    each("am-pm", (p) => {
      const f = p.figure!;
      expect(f.kind).toBe("dayLine");
      const events = f.events as { hour24: number; icon: string }[];
      expect(events.map((e) => e.hour24)).toEqual([p.data.e0, p.data.e1, p.data.e2, p.data.e3]);
      const pmShown = events.filter((e) => e.hour24 >= 12).length;
      expect(pmShown).toBe(p.data.pmCount);
    });
  });

  it("shape-equations: equation strings match the secret values", () => {
    each("shape-equations", (p) => {
      const eqs = p.figure!.equations as string[];
      const d = p.data;
      expect(eqs[0]).toBe(`🔶 + 🔶 = ${2 * d.d}`);
      expect(eqs[1]).toBe(`🔶 + 🟣 = ${d.d + d.c}`);
      expect(eqs[2]).toBe(`🟣 + ⭐ = ${d.c + d.st}`);
      // The prompt shows the same equations.
      for (const eq of eqs) expect(p.promptText).toContain(eq);
    });
  });
});
