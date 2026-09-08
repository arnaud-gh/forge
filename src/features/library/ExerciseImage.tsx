import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Exercise } from './exercises';

type Props = {
  exercise: Exercise | null;
  /** Alternate the two poses every 2s (set screen) or show the first pose. */
  alternate?: boolean;
  className?: string;
};

// Exercise photo with the DESIGN.md in-card recipe; generic placeholder when the
// exercise has no images (custom exercises, LIB-3).
export function ExerciseImage({ exercise, alternate = false, className }: Props) {
  const images = exercise?.images ?? [];
  const [pose, setPose] = useState(0);

  useEffect(() => {
    if (!alternate || images.length < 2) return;
    const id = window.setInterval(() => setPose((p) => (p + 1) % images.length), 2000);
    return () => window.clearInterval(id);
  }, [alternate, images.length]);

  const src = images[alternate ? pose : 0];

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xs border border-line-strong bg-surface',
          className,
        )}
        aria-hidden
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-ink-ghost"
        >
          <path d="M4 12h3l2-5 3 10 2-5h6" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={cn('rounded-xs border border-line-strong bg-surface object-cover', className)}
      style={{ filter: 'grayscale(1) contrast(1.1) brightness(0.92)' }}
    />
  );
}
