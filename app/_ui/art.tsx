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
