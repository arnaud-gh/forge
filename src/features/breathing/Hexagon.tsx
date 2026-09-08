import type { ReactNode } from 'react';

// Concentric hexagon (DESIGN.md breathing shape): outer stroke, inner fill scaled
// by the current breath. Scale is driven by the caller from timestamps, so the
// shape is exact after backgrounding and never overshoots.
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const OUTER = hexPoints(100, 100, 92);
const INNER = hexPoints(100, 100, 92);

export function Hexagon({
  scale,
  dim = false,
  children,
}: {
  scale: number;
  dim?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative mx-auto aspect-square w-[min(72vw,320px)]"
      style={{ filter: 'drop-shadow(var(--glow-breath))', opacity: dim ? 0.8 : 1 }}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <polygon points={OUTER} fill="none" stroke="var(--breath-border)" strokeWidth="1.5" />
        <polygon
          points={INNER}
          fill="var(--breath-faint)"
          stroke="var(--breath-border)"
          strokeWidth="1"
          style={{ transform: `scale(${scale})`, transformOrigin: '100px 100px' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
