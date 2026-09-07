import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Accessible label for the close button (i18n string from the caller). */
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

// DESIGN.md: slide up from bottom, bg-app, radius-sm top corners, 1px border-default top,
// grab handle, scrim black 60%, enter y 100% over duration-screen, max height 85vh.
export function Sheet({
  open,
  onClose,
  title,
  closeLabel = 'Close',
  children,
  footer,
  className,
}: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-sheet flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative flex max-h-[85vh] flex-col rounded-t-sm border-t border-line bg-app pb-safe',
              className,
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3">
              <div className="h-1 w-9 rounded-full bg-ink/30" />
            </div>
            {title != null && (
              <div className="flex items-center justify-between px-gutter pb-2 pt-3">
                <h2 className="font-display text-display-xs uppercase text-ink">{title}</h2>
                <IconButton
                  label={closeLabel}
                  onClick={onClose}
                  className="border-0 text-ink-muted"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-gutter py-2">{children}</div>
            {footer != null && <div className="border-t border-line px-gutter py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
