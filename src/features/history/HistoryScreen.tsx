import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '@/components';
import { cn } from '@/lib/cn';
import { mondayOfWeek, useProgramStore, type DayState } from '@/features/program';
import { BreathingHistory } from '@/features/breathing/BreathingHistory';
import { MonthGrid } from '@/features/home/WeekStrip';
import { DaySheet } from '@/features/home/DaySheet';
import { fetchRecentWorkouts, type WorkoutRow } from './workouts';

type Tab = 'workouts' | 'breathing' | 'calendar';
type Filter = 'all' | 'program' | 'extra';

// History (HIST-1/4/5): Workouts (with program/extra filter), Breathing, Calendar.
export function HistoryScreen() {
  const { t } = useTranslation(['history', 'breathe']);
  const navigate = useNavigate();
  const location = useLocation();
  const program = useProgramStore((s) => s.program);
  const progress = useProgramStore((s) => s.progress);
  const initial = ((location.state as { tab?: Tab } | null)?.tab ?? 'workouts') as Tab;
  const [tab, setTab] = useState<Tab>(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [rows, setRows] = useState<WorkoutRow[] | null>(null);
  const [daySel, setDaySel] = useState<{
    date: Date;
    sessionId: string | null;
    state: DayState;
  } | null>(null);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    void fetchRecentWorkouts(100).then(setRows);
  }, []);

  const visible = (rows ?? []).filter((w) =>
    filter === 'all' ? true : filter === 'extra' ? w.isStandalone : !w.isStandalone,
  );

  return (
    <div className="min-h-full px-gutter py-8">
      <h1 className="mb-4 font-display text-display-md uppercase text-ink">{t('history:title')}</h1>

      <div className="mb-6 flex gap-2">
        {(['workouts', 'breathing', 'calendar'] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'flex-1 rounded-sm border py-2 font-display text-btn-sm uppercase',
              tab === k ? 'border-accent text-accent' : 'border-line-emphasis text-ink-muted',
            )}
          >
            {k === 'workouts'
              ? t('history:workouts')
              : k === 'breathing'
                ? t('breathe:history.title')
                : t('history:calendar')}
          </button>
        ))}
      </div>

      {tab === 'breathing' && <BreathingHistory />}

      {tab === 'calendar' &&
        (program && progress ? (
          <MonthGrid
            program={program}
            progress={progress}
            today={today}
            reference={mondayOfWeek(progress.startDate, 1)}
            onSelectDay={(date, sessionId, state) => setDaySel({ date, sessionId, state })}
          />
        ) : (
          <EmptyState title={t('history:calendar')} body={t('history:empty')} />
        ))}

      {tab === 'workouts' && (
        <>
          <div className="mb-4 flex gap-2">
            {(['all', 'program', 'extra'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-xs border px-2.5 py-[5px] font-ui text-[10px] font-bold uppercase tracking-[0.04em]',
                  filter === f
                    ? 'border-[var(--accent-border)] text-accent'
                    : 'border-line-emphasis text-ink-secondary',
                )}
              >
                {t(`history:filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
              </button>
            ))}
          </div>
          {rows === null ? null : visible.length === 0 ? (
            <div className="py-10">
              <EmptyState title={t('history:title')} body={t('history:empty')} />
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => navigate(`/history/workout/${w.id}`)}
                  >
                    <Card padding="summary">
                      <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
                        {new Date(w.endedAt).toLocaleDateString('en', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="mt-1 font-display text-display-xs uppercase text-ink">
                        {w.sessionName}
                      </p>
                      <p className="mt-1 font-ui text-meta text-ink-muted">
                        {t('history:meta', {
                          min: Math.round(w.durationSec / 60),
                          sets: w.totals.setsDone,
                          volume: Math.round(w.totals.volumeKg),
                        })}
                      </p>
                    </Card>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {program && (
        <DaySheet
          open={daySel !== null}
          onClose={() => setDaySel(null)}
          date={daySel?.date ?? null}
          sessionId={daySel?.sessionId ?? null}
          state={daySel?.state ?? null}
          program={program}
        />
      )}
    </div>
  );
}
