import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState } from '@/components';
import { auth, db } from '@/lib/firebase';
import type { SavedWorkout } from '@/features/player';

interface WorkoutRow extends SavedWorkout {
  id: string;
}

// Minimal workout history list (HIST-1). Full detail, filters, exercise history
// and breathing history arrive in M5.
export function HistoryScreen() {
  const { t } = useTranslation('history');
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
      <h1 className="mb-6 font-display text-display-md uppercase text-ink">{t('title')}</h1>

      {rows === null ? null : rows.length === 0 ? (
        <div className="py-10">
          <EmptyState title={t('title')} body={t('empty')} />
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
                  {t('meta', {
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
