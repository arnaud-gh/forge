import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';

type DialogProps = {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** Confirm styled as destructive (delete/discard) or primary. */
  confirmVariant?: 'primary' | 'destructive';
  onCancel: () => void;
  onConfirm: () => void;
};

// DESIGN.md: centered panel (not a sheet), bg-app, 1px border-default, radius-sm,
// padding 24px, max width 320px, over z-scrim. Two buttons in a row.
export function Dialog({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmVariant = 'primary',
  onCancel,
  onConfirm,
}: DialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-scrim flex items-center justify-center px-gutter">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-[320px] rounded-sm border border-line bg-app p-6"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <h2 className="font-display text-display-xs uppercase text-ink">{title}</h2>
            {body != null && <p className="mt-3 font-ui text-body text-ink-secondary">{body}</p>}
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" size="md" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant={confirmVariant} size="md" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
