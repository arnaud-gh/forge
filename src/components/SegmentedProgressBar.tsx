import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type ProgressSegment = {
  /** Relative width weight (DESIGN.md: flex weight = set count). */
  weight: number;
  status: 'done' | 'current' | 'upcoming';
  /** For the current segment: fill fraction 0..1 (logged sets / total). */
  progress?: number;
};

type SegmentedProgressBarProps = {
  segments: ProgressSegment[];
  className?: string;
};

// DESIGN.md: 3px tall, gap-3px, square ends, one segment per exercise.
export function SegmentedProgressBar({ segments, className }: SegmentedProgressBarProps) {
  return (
    <div className={cn('flex h-[3px] w-full gap-[3px]', className)}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn(
            'relative h-full overflow-hidden',
            seg.status === 'done' ? 'bg-ink/45' : 'bg-ink/[0.14]',
          )}
          style={{ flexGrow: seg.weight }}
        >
          {seg.status === 'current' && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-accent"
              initial={false}
              animate={{ width: `${Math.round((seg.progress ?? 0) * 100)}%` }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
