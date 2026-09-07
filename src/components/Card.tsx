import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardProps = {
  children: ReactNode;
  /** 'today' uses the larger 22/20 padding, 'summary' the compact 14/16 (DESIGN.md). */
  padding?: 'today' | 'summary' | 'none';
  /** 1px accent border (current state, resume banner). */
  accent?: boolean;
  /** Floating over photography uses bg-panel instead of transparent. */
  onPhoto?: boolean;
  className?: string;
};

const paddings: Record<NonNullable<CardProps['padding']>, string> = {
  today: 'px-5 py-[22px]',
  summary: 'px-4 py-[14px]',
  none: '',
};

// DESIGN.md Cards: radius-sm, 1px border-default. Never nest more than one level.
export function Card({
  children,
  padding = 'today',
  accent = false,
  onPhoto = false,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-sm border',
        accent ? 'border-[var(--accent-border)]' : 'border-line',
        onPhoto && 'bg-[var(--bg-panel)]',
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
