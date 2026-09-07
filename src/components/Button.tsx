import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = {
  variant?: ButtonVariant;
  /** Large bottom action (btn-lg, default) or paired-row size (btn). */
  size?: 'lg' | 'md';
  /** Stretch to fill available width (bottom action zone) or flex within a row. */
  block?: boolean;
  children: ReactNode;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>;

// DESIGN.md: pressed recipe is always scale 0.97 + brightness 1.1, duration-tap, ease-standard.
const pressTransition = { duration: 0.12, ease: [0.2, 0, 0, 1] as const };

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-display uppercase ' +
  'transition-colors duration-tap select-none disabled:pointer-events-none';

// h-14 == 56px (DESIGN.md primary geometry 56-58px).
const geometry = 'h-14 px-6';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink disabled:bg-line-strong disabled:text-ink-faint',
  secondary:
    'bg-transparent border border-line-emphasis text-ink disabled:text-ink-faint disabled:border-line',
  ghost: 'bg-transparent text-ink-muted disabled:text-ink-ghost',
  destructive:
    'bg-transparent border border-danger text-danger disabled:text-ink-faint disabled:border-line',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', block = true, className, disabled, children, ...rest },
  ref,
) {
  const sizeClass = size === 'lg' ? 'text-btn-lg' : 'text-btn';
  // Ghost keeps label typography rather than button geometry per DESIGN.md.
  const geom = variant === 'ghost' ? 'h-14 px-4' : geometry;
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97, filter: 'brightness(1.1)' }}
      transition={pressTransition}
      className={cn(base, geom, sizeClass, block && 'w-full', variants[variant], className)}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
