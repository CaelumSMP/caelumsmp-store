import type { CSSProperties } from "react";

// Isometric block, ported from ../caelum-web-fable/app/_ui/art.tsx.
// Light comes from the top-left. Pass `d` to make it a parallax floater.
export function Cube({
  size = 80,
  top = "#7bd35a",
  left = "#8b5a2b",
  right = "#6b4423",
  d,
  at,
  className,
}: {
  size?: number;
  top?: string;
  left?: string;
  right?: string;
  d?: number;
  at?: CSSProperties;
  className?: string;
}) {
  const floating = d !== undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={[floating ? "cl-floater" : "", className].filter(Boolean).join(" ")}
      style={floating ? ({ ["--d" as string]: d, ...at } as CSSProperties) : at}
    >
      <polygon points="50,4 96,27 50,50 4,27" fill={top} />
      <polygon points="4,27 50,50 50,97 4,74" fill={left} />
      <polygon points="50,50 96,27 96,74 50,97" fill={right} />
    </svg>
  );
}

// Tiny pixel-art renderer, ported from ../caelum-web-fable/app/_ui/art.tsx.
// Only the two sprites the store header needs — the main site has the full set.
type Sprite = { rows: string[]; colors: Record<string, string> };

const sprites = {
  chest: {
    rows: ["bbbbbbbb", "boooooob", "boooooob", "bbbggbbb", "booggoob", "boooooob", "boooooob", "bbbbbbbb"],
    colors: { b: "#5c3a1a", o: "#b0762e", g: "#e8e8e8" },
  },
  discord: {
    rows: [".bbbbbb.", "bbbbbbbb", "bbwbbwbb", "bbwbbwbb", "bbbbbbbb", "bwbbbbwb", ".bwwwwb.", "..b..b.."],
    colors: { b: "#5865f2", w: "#ffffff" },
  },
} satisfies Record<string, Sprite>;

export function Icon({ name, size = 16 }: { name: keyof typeof sprites; size?: number }) {
  const sprite: Sprite = sprites[name];
  const w = Math.max(...sprite.rows.map((r) => r.length));
  return (
    <svg viewBox={`0 0 ${w} ${sprite.rows.length}`} shapeRendering="crispEdges" style={{ width: size, height: size }} aria-hidden>
      {sprite.rows.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={sprite.colors[c]} />,
        ),
      )}
    </svg>
  );
}
