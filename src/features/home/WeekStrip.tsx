import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, WeekDayCell } from '@/components';
import { cn } from '@/lib/cn';
import {
  addDays,
  dayInfoForDate,
  mondayOf,
  mondayOfWeek,
  weekDays,
  type DayState,
  type Program,
  type ProgramProgress,
} from '@/features/program';
import { abbreviateSession, findSession, weekdayLetter } from './homeData';

type WeekStripProps = {
  program: Program;
  progress: ProgramProgress;
  today: Date;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  onSelectDay: (date: Date, sessionId: string | null, state: DayState) => void;
};

function ChevronLeft() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Compact ring for the month grid (DESIGN.md: week-strip ring states at 18px).
function MonthRing({ state }: { state: DayState }) {
  if (state === 'done') return <span className="h-[18px] w-[18px] rounded-full bg-accent" />;
  if (state === 'rest') return <span className="h-1 w-1 rounded-full bg-ink-ghost" />;
  return (
    <span
      className="relative h-[18px] w-[18px] rounded-full border border-dashed border-ink-ghost"
      aria-hidden
    >
      {state === 'missed' && (
        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger" />
      )}
    </span>
  );
}

export function WeekStrip({
  program,
  progress,
  today,
  selectedWeek,
  onWeekChange,
  onSelectDay,
}: WeekStripProps) {
  const { t } = useTranslation('home');
  const [showMonth, setShowMonth] = useState(false);

  const cells = weekDays(program, progress, selectedWeek, today);

  const monthReference = mondayOfWeek(progress.startDate, selectedWeek);
  const monthLabel = monthReference.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const canPrev = selectedWeek > 1;
  const canNext = selectedWeek < program.weeks;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <IconButton
          label={t('week.prev')}
          onClick={() => canPrev && onWeekChange(selectedWeek - 1)}
          disabled={!canPrev}
          className="border-0"
        >
          <ChevronLeft />
        </IconButton>
        <button
          type="button"
          onClick={() => setShowMonth((v) => !v)}
          className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-secondary"
        >
          {showMonth ? monthLabel : t('weekOf', { n: selectedWeek, total: program.weeks })}
        </button>
        <IconButton
          label={t('week.next')}
          onClick={() => canNext && onWeekChange(selectedWeek + 1)}
          disabled={!canNext}
          className="border-0"
        >
          <ChevronRight />
        </IconButton>
      </div>

      {!showMonth ? (
        <div className="flex divide-x divide-line-faint overflow-hidden rounded-sm border border-line">
          {cells.map((cell) => {
            const session = cell.sessionId ? findSession(program, cell.sessionId) : null;
            return (
              <WeekDayCell
                key={cell.weekday}
                dayLetter={weekdayLetter(cell.weekday)}
                date={cell.date.getDate()}
                state={cell.state}
                sessionLabel={session ? abbreviateSession(session.name) : undefined}
                isToday={cell.isToday}
                onClick={() => onSelectDay(cell.date, cell.sessionId, cell.state)}
              />
            );
          })}
        </div>
      ) : (
        <MonthGrid
          program={program}
          progress={progress}
          today={today}
          reference={monthReference}
          onSelectDay={onSelectDay}
        />
      )}
    </section>
  );
}

export function MonthGrid({
  program,
  progress,
  today,
  reference,
  onSelectDay,
}: {
  program: Program;
  progress: ProgramProgress;
  today: Date;
  reference: Date;
  onSelectDay: (date: Date, sessionId: string | null, state: DayState) => void;
}) {
  const monthIndex = reference.getMonth();
  const firstOfMonth = new Date(reference.getFullYear(), monthIndex, 1);
  const gridStart = mondayOf(firstOfMonth);
  // 6 weeks always covers a calendar month.
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="rounded-sm border border-line p-3">
      <div className="grid grid-cols-7 gap-y-3">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center font-ui text-label-xs uppercase text-ink-muted">
            {d}
          </div>
        ))}
        {days.map((date) => {
          const info = dayInfoForDate(program, progress, date, today);
          const inMonth = date.getMonth() === monthIndex;
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDay(date, info.sessionId, info.state)}
              className={cn(
                'flex flex-col items-center gap-1',
                !inMonth && 'opacity-30',
                info.isToday && 'rounded-xs bg-[var(--accent-wash)]',
              )}
            >
              <span
                className={cn(
                  'font-display text-[15px] tabular-nums leading-none',
                  info.isToday ? 'text-accent' : 'text-ink-secondary',
                )}
              >
                {date.getDate()}
              </span>
              <span className="flex h-[18px] items-center justify-center">
                <MonthRing state={info.state} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
