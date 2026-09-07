import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type IconButtonProps = {
  /** Accessible label; required since the button has no visible text. */
  label: string;
  /** Add bg-panel when floating over photography (DESIGN.md). */
  onPhoto?: boolean;
  children: ReactNode;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>;

// DESIGN.md: 44px square, radius-sm, 1px border-strong, icon ink-muted.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, onPhoto = false, className, disabled, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97, filter: 'brightness(1.1)' }}
      transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line-strong text-ink-muted',
        'transition-colors duration-tap disabled:pointer-events-none disabled:text-ink-ghost',
        onPhoto && 'bg-[var(--bg-panel)]',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
