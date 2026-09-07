import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MinusIcon, PlusIcon } from './icons';
import { NumericKeypadSheet } from './NumericKeypadSheet';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Format the displayed value (e.g. "60" for weight, "8" for reps). */
  format?: (value: number) => string;
  /** Highlight the value in accent when changed but not yet logged. */
  changed?: boolean;
  /** Unit shown in the keypad (e.g. "kg"). */
  unit?: string;
  allowDecimalEntry?: boolean;
  keypadTitle?: string;
  keypadConfirmLabel?: string;
  closeLabel?: string;
  className?: string;
};

const pressTransition = { duration: 0.12, ease: [0.2, 0, 0, 1] as const };

// Long-press repeat: first tick after 350ms, then accelerating to 60ms.
const REPEAT_DELAY = 350;
const REPEAT_MIN = 60;

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = -Infinity,
  max = Infinity,
  format = (v) => String(v),
  changed = false,
  unit,
  allowDecimalEntry = false,
  keypadTitle,
  keypadConfirmLabel,
  closeLabel,
  className,
}: StepperProps) {
  const [keypadOpen, setKeypadOpen] = useState(false);
  const timer = useRef<number | null>(null);
  // Keep the latest value available to the repeat loop without re-subscribing.
  const valueRef = useRef(value);
  valueRef.current = value;

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  const bump = useCallback(
    (dir: 1 | -1) => {
      const next = clamp(Math.round((valueRef.current + dir * step) * 1000) / 1000);
      if (next !== valueRef.current) onChange(next);
    },
    [clamp, step, onChange],
  );

  const stopRepeat = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (dir: 1 | -1) => {
      bump(dir);
      let delay = REPEAT_DELAY;
      const tick = () => {
        bump(dir);
        delay = Math.max(REPEAT_MIN, delay * 0.8);
        timer.current = window.setTimeout(tick, delay);
      };
      timer.current = window.setTimeout(tick, delay);
    },
    [bump],
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  const button = (dir: 1 | -1, icon: React.ReactNode, ariaLabel: string) => (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      whileTap={{ scale: 0.97, filter: 'brightness(1.1)' }}
      transition={pressTransition}
      onPointerDown={(e) => {
        e.preventDefault();
        startRepeat(dir);
      }}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
      onPointerCancel={stopRepeat}
      className="flex h-11 w-11 items-center justify-center rounded-xs border border-line-strong text-ink-secondary"
    >
      {icon}
    </motion.button>
  );

  return (
    <div className={cn('rounded-sm border border-line-strong p-3', className)}>
      <div className="mb-2 font-ui text-label-xs uppercase text-ink-muted">{label}</div>
      <div className="flex items-center justify-between">
        {button(-1, <MinusIcon size={18} />, `Decrease ${label}`)}
        <button
          type="button"
          onClick={() => setKeypadOpen(true)}
          className={cn(
            'font-display text-value tabular-nums',
            changed ? 'text-accent' : 'text-ink',
          )}
        >
          {format(value)}
        </button>
        {button(1, <PlusIcon size={18} />, `Increase ${label}`)}
      </div>

      <NumericKeypadSheet
        open={keypadOpen}
        onClose={() => setKeypadOpen(false)}
        onConfirm={(v) => onChange(clamp(v))}
        initialValue={value}
        title={keypadTitle ?? label}
        unit={unit}
        allowDecimal={allowDecimalEntry}
        confirmLabel={keypadConfirmLabel}
        closeLabel={closeLabel}
      />
    </div>
  );
}
