import type { FigureSpec } from "../types";

// spec: { kind:"grid", cells:(number|string|null)[][] }
// A small operations grid. null cells render as a highlighted "?" slot.
export function Grid({ spec }: { spec: FigureSpec }) {
  const cells = (spec.cells as (number | string | null)[][]) ?? [];

  return (
    <div className="flex justify-center py-2">
      <div className="inline-block">
        {cells.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isOp = typeof cell === "string";
              const isBlank = cell === null;
              return (
                <div
                  key={c}
                  className={`w-12 h-12 flex items-center justify-center text-xl font-bold ${
                    isOp
                      ? "text-purple-400"
                      : isBlank
                        ? "bg-amber-50 border-2 border-amber-400 rounded-lg text-amber-500"
                        : "bg-white border-2 border-purple-200 rounded-lg text-purple-700"
                  }`}
                >
                  {isBlank ? "?" : cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
