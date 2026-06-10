import type { FigureSpec } from "../types";

// spec: { kind:"sequence", terms:(number|null)[] }
export function Sequence({ spec }: { spec: FigureSpec }) {
  const terms = (spec.terms as (number | null)[]) ?? [];

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap py-2">
      {terms.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`min-w-14 h-14 px-3 rounded-xl border-4 flex items-center justify-center text-2xl font-bold ${
              t === null
                ? "bg-amber-50 border-amber-400 text-amber-500"
                : "bg-white border-purple-300 text-purple-700"
            }`}
          >
            {t === null ? "?" : t}
          </div>
          {i < terms.length - 1 && <span className="text-purple-300 text-xl">→</span>}
        </div>
      ))}
    </div>
  );
}
