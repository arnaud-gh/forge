import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sheet, formatClock } from '@/components';
import { sameDay, type DayState, type Program } from '@/features/program';
import { fetchRecentWorkouts, type WorkoutRow } from '@/features/history/workouts';
import { findSession } from './homeData';

type DaySheetProps = {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  sessionId: string | null;
  state: DayState | null;
  program: Program;
};

const STATE_KEY: Record<DayState, string> = {
  done: 'day.done',
  missed: 'day.missed',
  todo: 'day.todo',
  rest: 'day.rest',
};

// Day sheet (HOME-4): the day's scheduled session and state, plus completed
// workouts that day (tap opens the detail in History).
export function DaySheet({ open, onClose, date, sessionId, state, program }: DaySheetProps) {
  const { t } = useTranslation(['home', 'history', 'common']);
  const navigate = useNavigate();
  const session = sessionId ? findSession(program, sessionId) : null;
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);

  useEffect(() => {
    if (!open || !date) return;
    let cancelled = false;
    void fetchRecentWorkouts(100).then((rows) => {
      if (!cancelled) setWorkouts(rows.filter((w) => sameDay(new Date(w.endedAt), date)));
    });
    return () => {
      cancelled = true;
    };
  }, [open, date]);

  const title = date
    ? date.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <Sheet open={open} onClose={onClose} title={title} closeLabel={t('common:actions.close')}>
      <div className="space-y-4 pb-4">
        {session ? (
          <div>
            <p className="font-display text-display-xs uppercase text-ink">{session.name}</p>
            {state && (
              <p className="mt-1 font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
                {t(STATE_KEY[state] ?? 'day.todo')}
              </p>
            )}
          </div>
        ) : (
          <p className="font-ui text-body text-ink-secondary">{t('day.rest')}</p>
        )}

        {workouts.length === 0 ? (
          <p className="font-ui text-meta text-ink-faint">{t('day.noActivity')}</p>
        ) : (
          <ul className="space-y-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/history/workout/${w.id}`);
                  }}
                  className="w-full rounded-sm border border-line px-3 py-2 text-left"
                >
                  <p className="font-display text-display-xs uppercase text-ink">{w.sessionName}</p>
                  <p className="mt-1 font-ui text-meta text-ink-muted">
                    {formatClock(w.durationSec)} ·{' '}
                    {t('history:meta', {
                      min: Math.round(w.durationSec / 60),
                      sets: w.totals.setsDone,
                      volume: Math.round(w.totals.volumeKg),
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
