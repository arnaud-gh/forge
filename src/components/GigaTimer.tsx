import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatClock, resolveGigaSize, type GigaVariant } from './gigaTimer.helpers';

type GigaTimerProps = {
  /** Seconds to display (already derived from timestamps by the caller). */
  seconds: number;
  variant: GigaVariant;
  /** Linear progress fraction 0..1 shown under the numerals (countdowns). */
  progress?: number;
  caption?: string;
  /** Tick-pulse (last 5 seconds of a countdown). */
  pulse?: boolean;
  /** Set timer over a photo adds a text shadow for contrast. */
  onPhoto?: boolean;
  className?: string;
};

export function GigaTimer({
  seconds,
  variant,
  progress,
  caption,
  pulse = false,
  onPhoto = false,
  className,
}: GigaTimerProps) {
  const formatted = formatClock(seconds);
  const sizeClass = resolveGigaSize(variant, formatted);
  const color = variant === 'rest' ? 'text-accent' : 'text-ink';
  const tick = Math.ceil(seconds); // re-key the pulse each second

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <motion.div
        key={pulse ? tick : 'steady'}
        animate={pulse ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
        className={cn(
          'font-display uppercase tabular-nums leading-none',
          sizeClass,
          color,
          onPhoto && 'drop-shadow-[0_2px_30px_rgba(11,13,16,0.7)]',
        )}
      >
        {formatted}
      </motion.div>

      {progress !== undefined && (
        <div className="mt-4 h-[5px] w-full max-w-[280px] overflow-hidden bg-ink/[0.16]">
          <div
            className="h-full bg-accent transition-[width] duration-state"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </div>
      )}

      {caption && (
        <div className="mt-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
          {caption}
        </div>
      )}
    </div>
  );
}
