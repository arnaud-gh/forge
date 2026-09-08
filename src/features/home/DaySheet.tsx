import { useTranslation } from 'react-i18next';
import { Sheet } from '@/components';
import type { DayState, Program } from '@/features/program';
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

// Past-day sheet (HOME-4). In M1 there are no logged workouts yet, so it shows
// the day's scheduled session and state; logged details arrive with History (M5).
export function DaySheet({ open, onClose, date, sessionId, state, program }: DaySheetProps) {
  const { t } = useTranslation(['home', 'common']);
  const session = sessionId ? findSession(program, sessionId) : null;
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
        <p className="font-ui text-meta text-ink-faint">{t('day.noActivity')}</p>
      </div>
    </Sheet>
  );
}
