import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, NumericKeypadSheet, formatClock } from '@/components';
import { useBreathingStore } from './breathingStore';
import { averageRetention, bestRetention } from './machine';
import { persistBreathingSession } from './save';

// Breathing summary (BR-11): average, editable/deletable rounds, note, save/restart/discard.
export function BreathingSummary({ startedAt }: { startedAt: number }) {
  const { t } = useTranslation('breathe');
  const navigate = useNavigate();
  const config = useBreathingStore((s) => s.config);
  const audio = useBreathingStore((s) => s.audio);
  const recoveryHoldSec = useBreathingStore((s) => s.recoveryHoldSec);
  const retentions = useBreathingStore((s) => s.retentions);
  const note = useBreathingStore((s) => s.note);
  const setNote = useBreathingStore((s) => s.setNote);
  const editRetention = useBreathingStore((s) => s.editRetention);
  const deleteRetention = useBreathingStore((s) => s.deleteRetention);
  const start = useBreathingStore((s) => s.start);
  const reset = useBreathingStore((s) => s.reset);

  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const avg = averageRetention(retentions);
  const best = bestRetention(retentions);
  const maxRetention = Math.max(1, ...retentions);

  const onSave = async () => {
    setSaving(true);
    try {
      await persistBreathingSession({
        startedAt,
        speed: config.speed,
        inhaleSec: config.inhaleSec,
        exhaleSec: config.exhaleSec,
        rounds: config.rounds,
        breaths: config.breaths,
        retentions,
        avgSec: avg,
        bestSec: best,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      reset();
      navigate('/history', { replace: true, state: { tab: 'breathing' } });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-deep pt-safe">
      <div className="flex-1 overflow-y-auto px-gutter pb-8 pt-8">
        <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-breath">
          {t('summary.title')}
        </p>
        <p className="mt-1 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
          {t('summary.average')}
        </p>
        <p className="font-display text-timer-md tabular-nums text-ink">{formatClock(avg)}</p>

        <ul className="mt-6 space-y-2">
          {retentions.map((sec, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-16 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                {t('summary.round', { n: i + 1 })}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-faint">
                <div
                  className="h-full bg-breath"
                  style={{ width: `${Math.round((sec / maxRetention) * 100)}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setEditing(i)}
                className="w-16 text-right font-display text-value tabular-nums text-ink"
              >
                {formatClock(sec)}
              </button>
              <button
                type="button"
                onClick={() => deleteRetention(i)}
                className="font-ui text-label-xs uppercase tracking-[0.14em] text-ink-ghost"
              >
                {t('summary.delete')}
              </button>
            </li>
          ))}
        </ul>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('summary.notePlaceholder')}
          rows={3}
          className="mt-6 w-full rounded-sm border border-line-strong bg-transparent p-3 font-ui text-body text-ink placeholder:text-ink-ghost"
        />

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={() => start(config, recoveryHoldSec, audio)}
            className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
          >
            {t('summary.restart')}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              navigate('/breathe', { replace: true });
            }}
            className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
          >
            {t('summary.discard')}
          </button>
        </div>
      </div>

      <div className="border-t border-line bg-deep px-gutter pb-safe pt-3">
        <Button
          variant="primary"
          onClick={() => void onSave()}
          disabled={saving || retentions.length === 0}
          className="bg-breath text-accent-ink"
        >
          {t('summary.save')}
        </Button>
      </div>

      <NumericKeypadSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        onConfirm={(v) => {
          if (editing !== null) editRetention(editing, v);
        }}
        initialValue={editing !== null ? (retentions[editing] ?? 0) : 0}
        title={t('summary.round', { n: (editing ?? 0) + 1 })}
        unit="s"
      />
    </div>
  );
}
