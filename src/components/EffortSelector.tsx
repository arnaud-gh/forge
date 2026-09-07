import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type Effort = 'easy' | 'ideal' | 'max';

type EffortSelectorProps = {
  value: Effort | null;
  onSelect: (effort: Effort) => void;
  /** Labels come from i18n; defaults are dev-only fallbacks. */
  labels?: Record<Effort, string>;
  className?: string;
};

const pressTransition = { duration: 0.12, ease: [0.2, 0, 0, 1] as const };

const config: Record<Effort, { dot: string; text: string; border: string; fill: string }> = {
  easy: {
    dot: 'bg-effort-easy',
    text: 'text-effort-easy',
    border: 'border-effort-easy',
    fill: 'bg-effort-easy/[0.14]',
  },
  ideal: {
    dot: 'bg-effort-ideal',
    text: 'text-effort-ideal',
    border: 'border-effort-ideal',
    fill: 'bg-effort-ideal/[0.14]',
  },
  max: {
    dot: 'bg-effort-max',
    text: 'text-effort-max',
    border: 'border-effort-max',
    fill: 'bg-effort-max/[0.14]',
  },
};

const order: Effort[] = ['easy', 'ideal', 'max'];
const defaultLabels: Record<Effort, string> = { easy: 'EASY', ideal: 'IDEAL', max: 'MAX' };

// DESIGN.md: three flex-1 cells, h-60px, 6px dot above btn-sm label. Selecting logs the set.
export function EffortSelector({
  value,
  onSelect,
  labels = defaultLabels,
  className,
}: EffortSelectorProps) {
  return (
    <div className={cn('flex gap-2', className)} role="radiogroup">
      {order.map((effort) => {
        const c = config[effort];
        const selected = value === effort;
        return (
          <motion.button
            key={effort}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.97, filter: 'brightness(1.1)' }}
            transition={pressTransition}
            onClick={() => onSelect(effort)}
            className={cn(
              'flex h-[60px] flex-1 flex-col items-center justify-center gap-2 rounded-sm border',
              selected ? cn(c.border, c.fill) : 'border-line-emphasis',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
            <span
              className={cn('font-display text-btn-sm uppercase', selected ? c.text : 'text-ink')}
            >
              {labels[effort]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
