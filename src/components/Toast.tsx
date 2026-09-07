import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type ToastProps = {
  open: boolean;
  message: string;
  tone?: 'success' | 'warning' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (DESIGN.md: 3s). 0 disables. */
  duration?: number;
};

const toneBar: Record<NonNullable<ToastProps['tone']>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

// DESIGN.md: bottom-anchored, bg-surface, 1px border-default, radius-sm, meta text,
// left 3px tone bar, one line, auto-dismiss 3s, slide + fade.
export function Toast({
  open,
  message,
  tone = 'success',
  actionLabel,
  onAction,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [open, duration, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex justify-center px-gutter pb-safe"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          <div className="pointer-events-auto mb-4 flex w-full max-w-[420px] items-center overflow-hidden rounded-sm border border-line bg-surface">
            <span className={cn('h-full w-[3px] self-stretch', toneBar[tone])} aria-hidden />
            <span className="flex-1 px-4 py-3 font-ui text-meta text-ink-secondary">{message}</span>
            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="px-4 py-3 font-display text-btn-sm uppercase text-ink-muted"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
