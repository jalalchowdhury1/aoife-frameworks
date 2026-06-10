import type { FigureSpec } from "../types";

// spec: { kind:"postRow", posts:number, spacing:number, unit:string }
// Renders posts as vertical bars with gaps between; the first gap is labeled.
export function PostRow({ spec }: { spec: FigureSpec }) {
  const posts = (spec.posts as number) ?? 0;
  const spacing = (spec.spacing as number) ?? 0;
  const unit = (spec.unit as string) ?? "";
  // Cap the drawn posts so wide problems still fit; show a "…" if truncated.
  const drawn = Math.min(posts, 9);

  return (
    <div className="py-2 overflow-x-auto">
      <div className="flex items-end justify-center gap-0 min-w-fit mx-auto">
        {Array.from({ length: drawn }).map((_, i) => (
          <div key={i} className="flex items-end">
            <div className="w-2 h-10 bg-purple-500 rounded-t-sm" />
            {i < drawn - 1 && (
              <div className="relative w-12 flex items-center justify-center">
                <div className="w-full border-t-2 border-dashed border-purple-300" />
                {i === 0 && (
                  <span className="absolute -top-5 text-xs text-purple-600 whitespace-nowrap">
                    {spacing} {unit}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {posts > drawn && <span className="ml-1 text-purple-500 self-center">…</span>}
      </div>
    </div>
  );
}
