import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Toggle } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { usePlayerStore } from './playerStore';
import { assembleWorkout } from './sequencer';
import { minutesOf } from '@/features/home/homeData';

type SummaryViewProps = {
  /** `keep` maps change keys (swap:<blockId>, remove:<blockId>, add:<blockId>, sets:<blockId>) to the toggle. */
  onSave: (note: string, keep: Record<string, boolean>) => void;
  saving: boolean;
};

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

export function SummaryView({ onSave, saving }: SummaryViewProps) {
  const { t } = useTranslation('player');
  const program = useProgramStore((s) => s.program);
  const context = usePlayerStore((s) => s.context);
  const steps = usePlayerStore((s) => s.steps);
  const logs = usePlayerStore((s) => s.logs);
  const notes = usePlayerStore((s) => s.notes);
  const changes = usePlayerStore((s) => s.changes);
  const startedAt = usePlayerStore((s) => s.startedAt);
  const [note, setNote] = useState('');
  const [keep, setKeep] = useState<Record<string, boolean>>({});

  const name = (id: string) => (program ? exerciseName(program, id) : id);
  const changeRows: { key: string; label: string }[] = [
    ...Object.entries(changes.swaps).map(([blockId, s]) => ({
      key: `swap:${blockId}`,
      label: t('changes.swap', { from: name(s.from), to: name(s.to) }),
    })),
    ...changes.removedBlocks.map((blockId) => ({
      key: `remove:${blockId}`,
      label: t('changes.removed', {
        name: name(steps.find((st) => st.blockId === blockId)?.exerciseId ?? blockId),
      }),
    })),
    ...changes.addedBlocks.map((a) => ({
      key: `add:${a.block.id}`,
      label: t('changes.added', { name: name(a.block.exerciseId) }),
    })),
    ...Object.entries(changes.setCounts).map(([blockId, c]) => ({
      key: `sets:${blockId}`,
      label: t('changes.sets', {
        name: name(steps.find((st) => st.blockId === blockId)?.exerciseId ?? blockId),
        from: c.from,
        to: c.to,
      }),
    })),
  ];
  const isKept = (key: string) => keep[key] ?? true; // default on (WRK-22)

  const workout = useMemo(
    () => (context ? assembleWorkout(context, steps, logs, notes, startedAt, Date.now()) : null),
    [context, steps, logs, notes, startedAt],
  );
  if (!workout) return null;

  const minutes = minutesOf(workout.durationSec);

  return (
    <div className="flex h-[100dvh] flex-col bg-app pt-safe">
      <div className="flex-1 overflow-y-auto px-gutter pb-8 pt-8">
        <h1 className="font-display text-display-lg uppercase text-ink">{t('summary.title')}</h1>
        <p className="mb-6 mt-1 font-ui text-meta text-ink-muted">{workout.sessionName}</p>

        <div className="mb-6 flex gap-2">
          <Stat label={t('summary.duration')} value={`${minutes}m`} />
          <Stat label={t('summary.volume')} value={`${Math.round(workout.totals.volumeKg)}`} />
          <Stat
            label={t('summary.sets')}
            value={`${workout.totals.setsDone}/${workout.totals.setsPlanned}`}
          />
        </div>

        <ul className="space-y-2">
          {workout.blocks.map((block) => {
            const done = block.sets.filter((s) => s.status === 'done').length;
            return (
              <li key={block.blockId} className="rounded-sm border border-line px-4 py-3">
                <p className="font-display text-display-xs uppercase text-ink">
                  {program ? exerciseName(program, block.exerciseId) : block.exerciseId}
                </p>
                <p className="mt-1 font-ui text-meta text-ink-muted">
                  {block.sets
                    .map((s) =>
                      s.weightKg !== undefined && s.reps !== undefined
                        ? `${s.weightKg}x${s.reps}`
                        : s.reps !== undefined
                          ? `${s.reps}`
                          : s.seconds !== undefined
                            ? `${s.seconds}s`
                            : '-',
                    )
                    .join('  ·  ')}{' '}
                  ({done}/{block.sets.length})
                </p>
              </li>
            );
          })}
        </ul>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('summary.notePlaceholder')}
          rows={3}
          className="mt-6 w-full rounded-sm border border-line-strong bg-transparent p-3 font-ui text-body text-ink placeholder:text-ink-ghost"
        />

        {changeRows.length > 0 && (
          <section className="mt-6 rounded-sm border border-line px-4 py-3">
            <h2 className="font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
              {t('changes.title')}
            </h2>
            <div className="divide-y divide-line-faint">
              {changeRows.map((row) => (
                <Toggle
                  key={row.key}
                  label={row.label}
                  hint={t('changes.keep')}
                  value={isKept(row.key)}
                  onChange={(v) => setKeep((k) => ({ ...k, [row.key]: v }))}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-line bg-app px-gutter pb-safe pt-3">
        <Button
          variant="primary"
          onClick={() =>
            onSave(note, Object.fromEntries(changeRows.map((r) => [r.key, isKept(r.key)])))
          }
          disabled={saving}
        >
          {t('summary.save')}
        </Button>
      </div>
    </div>
  );
}
