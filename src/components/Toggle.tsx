import { cn } from '@/lib/cn';

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Amber (default) or ice-blue inside the Breathe tab. */
  tone?: 'accent' | 'breath';
  hint?: string;
};

// Settings row toggle (DESIGN.md: toggles use accent when on).
export function Toggle({ label, value, onChange, tone = 'accent', hint }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 py-3 text-left"
    >
      <span>
        <span className="block font-ui text-body text-ink">{label}</span>
        {hint && <span className="block font-ui text-meta text-ink-muted">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-state',
          value ? (tone === 'breath' ? 'bg-breath' : 'bg-accent') : 'bg-line-emphasis',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-app transition-transform duration-state',
            value ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
