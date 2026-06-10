import type { FigureSpec } from "../types";

// spec: { kind:"numberBond", circles:(number|null)[], squares:(number|null)[] }
// circles in a row; squares sit between each adjacent pair of circles.
export function NumberBond({ spec }: { spec: FigureSpec }) {
  const circles = (spec.circles as (number | null)[]) ?? [];
  const squares = (spec.squares as (number | null)[]) ?? [];
  const show = (v: number | null) => (v === null ? "?" : String(v));

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap py-2">
      {circles.map((c, i) => (
        <div key={`c${i}`} className="flex items-center gap-1">
          <div
            className="w-16 h-16 rounded-full bg-pink-100 border-4 border-pink-400 flex items-center justify-center text-2xl font-bold text-pink-700"
            aria-label={`circle ${show(c)}`}
          >
            {show(c)}
          </div>
          {i < squares.length && (
            <div
              className="w-14 h-14 rounded-xl bg-purple-100 border-4 border-purple-400 flex items-center justify-center text-xl font-bold text-purple-700"
              aria-label={`square ${show(squares[i])}`}
            >
              {show(squares[i])}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
