import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
};

// DESIGN.md: centered, label-sm uppercase muted title, one body line ink-faint,
// optional secondary button. No illustrations, no icons above 22px.
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-gutter text-center', className)}
    >
      <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">{title}</p>
      {body && <p className="mt-3 max-w-[280px] font-ui text-body text-ink-faint">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
