import type { FigureSpec } from "../types";

interface Bar {
  label: string;
  value: number;
  known: boolean;
}

// spec: { kind:"bars", bars:Bar[], unit?:string }
// Horizontal bars scaled to the largest value; unknown bars render hatched.
export function Bars({ spec }: { spec: FigureSpec }) {
  const bars = (spec.bars as Bar[]) ?? [];
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="flex flex-col gap-2 py-2 max-w-md mx-auto">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-16 text-right text-sm font-bold text-purple-700 shrink-0">
            {b.label}
          </div>
          <div className="flex-1 h-9 bg-purple-50 rounded-lg overflow-hidden">
            <div
              className={`h-full rounded-lg flex items-center justify-end pr-2 text-white text-sm font-bold ${
                b.known ? "bg-pink-400" : "bg-purple-300"
              }`}
              style={{
                width: `${Math.max(12, (b.value / max) * 100)}%`,
                backgroundImage: b.known
                  ? undefined
                  : "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,.4) 6px, rgba(255,255,255,.4) 12px)",
              }}
            >
              {b.known ? b.value : "?"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
