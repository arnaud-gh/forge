import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '@/components';
import { cn } from '@/lib/cn';
import { auth, db } from '@/lib/firebase';
import type { SavedWorkout } from '@/features/player';
import { BreathingHistory } from '@/features/breathing/BreathingHistory';

interface WorkoutRow extends SavedWorkout {
  id: string;
}

type Tab = 'workouts' | 'breathing';

// History (HIST-1/4): segmented control Workouts / Breathing.
export function HistoryScreen() {
  const { t } = useTranslation(['history', 'breathe']);
  const location = useLocation();
  const initial = ((location.state as { tab?: Tab } | null)?.tab ?? 'workouts') as Tab;
  const [tab, setTab] = useState<Tab>(initial);
  const [rows, setRows] = useState<WorkoutRow[] | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setRows([]);
      return;
    }
    void (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'users', uid, 'workouts'), orderBy('createdAt', 'desc'), limit(50)),
        );
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedWorkout) })));
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-full px-gutter py-8">
      <h1 className="mb-4 font-display text-display-md uppercase text-ink">{t('history:title')}</h1>

      <div className="mb-6 flex gap-2">
        {(['workouts', 'breathing'] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'flex-1 rounded-sm border py-2 font-display text-btn-sm uppercase',
              tab === k ? 'border-accent text-accent' : 'border-line-emphasis text-ink-muted',
            )}
          >
            {k === 'workouts' ? t('history:title') : t('breathe:history.title')}
          </button>
        ))}
      </div>

      {tab === 'breathing' ? (
        <BreathingHistory />
      ) : rows === null ? null : rows.length === 0 ? (
        <div className="py-10">
          <EmptyState title={t('history:title')} body={t('history:empty')} />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((w) => (
            <li key={w.id}>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
