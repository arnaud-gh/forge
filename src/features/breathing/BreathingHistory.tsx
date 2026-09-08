import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, EmptyState, formatClock } from '@/components';
import { auth, db } from '@/lib/firebase';
import type { BreathingSessionRecord } from './save';

interface Row extends BreathingSessionRecord {
  id: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-sm border border-line px-3 py-3 text-center">
      <p className="font-display text-value tabular-nums text-ink">{value}</p>
      <p className="mt-1 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}

// Breathing history (BR-13): bar chart of best retention per session, totals,
// personal best highlighted, list of sessions.
export function BreathingHistory() {
  const { t } = useTranslation('breathe');
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setRows([]);
      return;
    }
    void (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users', uid, 'breathingSessions'),
            orderBy('createdAt', 'desc'),
            limit(60),
          ),
        );
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BreathingSessionRecord) })));
      } catch {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null) return null;
  if (rows.length === 0) {
    return (
      <div className="py-10">
        <EmptyState title={t('history.title')} body={t('history.empty')} />
      </div>
    );
  }

  const totalRounds = rows.reduce((n, r) => n + r.retentions.length, 0);
  const totalRetention = rows.reduce((n, r) => n + r.retentions.reduce((a, b) => a + b, 0), 0);
  const personalBest = Math.max(...rows.map((r) => r.bestSec));
  const chartData = [...rows]
    .reverse()
    .slice(-20)
    .map((r) => ({ id: r.id, best: r.bestSec, avg: r.avgSec }));

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Stat label={t('history.sessions')} value={String(rows.length)} />
        <Stat label={t('history.rounds')} value={String(totalRounds)} />
        <Stat label={t('history.total')} value={formatClock(totalRetention)} />
      </div>

      <div className="rounded-sm border border-line p-3">
        <p className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
          {t('history.best')}
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="id" hide />
              <YAxis
                tick={{ fill: '#76828F', fontSize: 9, fontFamily: 'Archivo' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatClock(v)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(200,220,240,0.06)' }}
                contentStyle={{
                  background: '#10141A',
                  border: '1px solid rgba(200,220,240,0.12)',
                  borderRadius: 4,
                  fontFamily: 'Archivo',
                  fontSize: 12,
                }}
                formatter={(v: number) => formatClock(v)}
              />
              <Bar dataKey="best" radius={[2, 2, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.id} fill={d.best === personalBest ? '#FFB000' : '#9EB8C9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Card padding="summary">
              <div className="flex items-baseline justify-between">
                <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-breath">
                  {new Date(r.startedAt).toLocaleDateString('en', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
                {r.bestSec === personalBest && (
                  <span className="font-ui text-label-xs uppercase tracking-[0.14em] text-accent">
                    {t('history.personalBest')}
                  </span>
                )}
              </div>
              <p className="mt-1 font-ui text-meta text-ink-muted">
                {t('history.meta', {
                  rounds: r.retentions.length,
                  avg: formatClock(r.avgSec),
                  best: formatClock(r.bestSec),
                })}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
