import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ChipProps = {
  children: ReactNode;
  /** Amber recommendation chip (default) or grey informational variant. */
  variant?: 'recommendation' | 'info';
  className?: string;
};

// DESIGN.md: radius-xs, 1px accent-border, text accent, Archivo 700 10px uppercase, tracking .04em.
export function Chip({ children, variant = 'recommendation', className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border px-2.5 py-[5px] font-ui text-[10px] font-bold uppercase tracking-[0.04em]',
        variant === 'recommendation'
          ? 'border-[var(--accent-border)] text-accent'
          : 'border-line-emphasis text-ink-secondary',
        className,
      )}
    >
      {children}
    </span>
  );
}
