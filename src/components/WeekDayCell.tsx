import { cn } from '@/lib/cn';

export type DayState = 'done' | 'todo' | 'missed' | 'rest';

type WeekDayCellProps = {
  /** Single weekday letter, e.g. "M". */
  dayLetter: string;
  /** Day of month. */
  date: number;
  state: DayState;
  /** Abbreviated session name, or REST label. */
  sessionLabel?: string;
  isToday?: boolean;
  onClick?: () => void;
};

// One column of the week strip. The 7-column container is composed in Home (M1).
// DESIGN.md: weekday letter (label-sm), date (Anton 17px), 18px state ring, session label.
function Ring({ state, isToday }: { state: DayState; isToday: boolean }) {
  const size = 'h-[18px] w-[18px]';
  if (state === 'done') {
    return <span className={cn(size, 'rounded-full bg-accent')} aria-hidden />;
  }
  if (state === 'rest') {
    return <span className="h-1 w-1 rounded-full bg-ink-ghost" aria-hidden />;
  }
  // todo / missed: dashed outline; today overrides to a solid ink ring.
  return (
    <span
      className={cn(
        size,
        'relative rounded-full border',
        isToday ? 'border-2 border-solid border-ink' : 'border-dashed border-ink-ghost',
      )}
      aria-hidden
    >
      {state === 'missed' && (
        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger" />
      )}
    </span>
  );
}

export function WeekDayCell({
  dayLetter,
  date,
  state,
  sessionLabel,
  isToday = false,
  onClick,
}: WeekDayCellProps) {
  const labelColor = state === 'done' ? 'text-ink-secondary' : 'text-ink-ghost';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-1.5 px-1 py-2.5',
        isToday && 'bg-[var(--accent-wash)]',
      )}
    >
      {isToday && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden />}
      <span
        className={cn(
          'font-ui text-label-sm uppercase',
          isToday ? 'text-accent' : 'text-ink-muted',
        )}
      >
        {dayLetter}
      </span>
      <span className="font-display text-[17px] tabular-nums leading-none text-ink-secondary">
        {date}
      </span>
      <span className="flex h-[18px] items-center justify-center">
        <Ring state={state} isToday={isToday} />
      </span>
      <span className={cn('h-3 font-ui text-label-xs uppercase', labelColor)}>
        {sessionLabel ?? ''}
      </span>
    </button>
  );
}
