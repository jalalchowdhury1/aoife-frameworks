import type { FigureSpec } from "../types";

// spec: { kind:"dotArray", rows:number, cols:number }
export function DotArray({ spec }: { spec: FigureSpec }) {
  const rows = (spec.rows as number) ?? 0;
  const cols = (spec.cols as number) ?? 0;

  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-1.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="w-5 h-5 rounded-full bg-pink-400 shadow-sm" />
          ))}
        </div>
      ))}
    </div>
  );
}
