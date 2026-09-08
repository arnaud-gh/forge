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
  /** Anchor position. 'top' keeps it clear of a bottom action zone (player). */
  position?: 'bottom' | 'top';
};

const toneBar: Record<NonNullable<ToastProps['tone']>, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

// DESIGN.md: anchored above the bottom action zone (or top, to avoid covering it),
// bg-surface, 1px border, left 3px tone bar, one line, auto-dismiss 3s, slide + fade.
export function Toast({
  open,
  message,
  tone = 'success',
  actionLabel,
  onAction,
  onDismiss,
  duration = 3000,
  position = 'bottom',
}: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [open, duration, onDismiss]);

  const isTop = position === 'top';
  const enterY = isTop ? -16 : 16;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          className={cn(
            'pointer-events-none fixed inset-x-0 z-toast flex justify-center px-gutter',
            isTop ? 'top-0 pt-safe' : 'bottom-0 pb-safe',
          )}
          initial={{ opacity: 0, y: enterY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: enterY }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          <div
            className={cn(
              'pointer-events-auto flex w-full max-w-[420px] items-center overflow-hidden rounded-sm border border-line bg-surface',
              isTop ? 'mt-4' : 'mb-4',
            )}
          >
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
