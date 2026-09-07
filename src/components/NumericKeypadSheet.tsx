import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { cn } from '@/lib/cn';

type NumericKeypadSheetProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue: number;
  title?: string;
  unit?: string;
  allowDecimal?: boolean;
  confirmLabel?: string;
  closeLabel?: string;
};

const pressTransition = { duration: 0.12, ease: [0.2, 0, 0, 1] as const };

export function NumericKeypadSheet({
  open,
  onClose,
  onConfirm,
  initialValue,
  title = 'Enter value',
  unit,
  allowDecimal = false,
  confirmLabel = 'OK',
  closeLabel = 'Close',
}: NumericKeypadSheetProps) {
  const [entry, setEntry] = useState('');

  // Reset the buffer each time the sheet opens.
  useEffect(() => {
    if (open) setEntry(initialValue ? String(initialValue) : '');
  }, [open, initialValue]);

  const press = (key: string) => {
    setEntry((prev) => {
      if (key === 'del') return prev.slice(0, -1);
      if (key === '.') {
        if (!allowDecimal || prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      // Avoid leading zeros like "007".
      if (prev === '0') return key;
      return prev + key;
    });
  };

  const confirm = () => {
    const parsed = parseFloat(entry);
    onConfirm(Number.isFinite(parsed) ? parsed : 0);
    onClose();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : '', '0', 'del'];

  return (
    <Sheet open={open} onClose={onClose} title={title} closeLabel={closeLabel}>
      <div className="pb-2">
        <div className="mb-4 flex items-baseline justify-center gap-2">
          <span className="font-display text-timer-md tabular-nums text-ink">{entry || '0'}</span>
          {unit && <span className="font-ui text-body text-ink-muted">{unit}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k, i) =>
            k === '' ? (
              <div key={`spacer-${i}`} />
            ) : (
              <motion.button
                key={k}
                type="button"
                whileTap={{ scale: 0.97, filter: 'brightness(1.1)' }}
                transition={pressTransition}
                onClick={() => press(k)}
                className={cn(
                  'flex h-14 items-center justify-center rounded-sm border border-line-strong',
                  'font-display text-value tabular-nums text-ink',
                )}
              >
                {k === 'del' ? '⌫' : k}
              </motion.button>
            ),
          )}
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={confirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
