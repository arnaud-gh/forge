import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, IconButton, CloseIcon } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { fetchWorkout, type WorkoutRow } from './workouts';

const effortColor: Record<string, string> = { easy: '#8FB3CC', ideal: '#FFB000', max: '#FF5C33' };

// Workout detail (HIST-2): everything logged, grouped by section.
export function WorkoutDetail() {
  const { t } = useTranslation(['history', 'common']);
  const navigate = useNavigate();
  const { id } = useParams();
  const program = useProgramStore((s) => s.program);
  const [workout, setWorkout] = useState<WorkoutRow | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    void fetchWorkout(id).then(setWorkout);
  }, [id]);

  if (workout === undefined) return <div className="min-h-full" />;
  if (workout === null) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <EmptyState title={t('history:title')} body={t('history:empty')} />
      </div>
    );
  }

  const bySection = new Map<string, WorkoutRow['blocks']>();
  for (const b of workout.blocks) {
    const list = bySection.get(b.sectionName) ?? [];
    list.push(b);
    bySection.set(b.sectionName, list);
  }

  return (
    <div className="px-gutter pb-8 pt-4">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
            {new Date(workout.endedAt).toLocaleDateString('en', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="mt-1 font-display text-display-md uppercase leading-none text-ink">
            {workout.sessionName}
          </h1>
          <p className="mt-2 font-ui text-meta text-ink-muted">
            {t('history:meta', {
              min: Math.round(workout.durationSec / 60),
              sets: workout.totals.setsDone,
              volume: Math.round(workout.totals.volumeKg),
            })}
          </p>
        </div>
        <IconButton
          label={t('common:actions.close')}
          onClick={() => navigate(-1)}
          className="border-0"
        >
          <CloseIcon />
        </IconButton>
      </header>

      {workout.note && <p className="mb-6 font-ui text-body text-ink-secondary">{workout.note}</p>}

      <div className="space-y-6">
        {[...bySection.entries()].map(([section, blocks]) => (
          <section key={section}>
            <h2 className="mb-2 font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
              {section}
            </h2>
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.blockId} className="rounded-sm border border-line px-3 py-3">
                  <p className="font-display text-display-xs uppercase text-ink">
                    {program ? exerciseName(program, b.exerciseId) : b.exerciseId}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-ui text-meta tabular-nums text-ink-secondary">
                    {b.sets.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {s.status === 'skipped'
                          ? '–'
                          : s.weightKg !== undefined && s.reps !== undefined
                            ? `${s.weightKg}×${s.reps}`
                            : s.reps !== undefined
                              ? `${s.reps}`
                              : s.seconds !== undefined
                                ? `${s.seconds}s`
                                : '✓'}
                        {s.effort && (
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ background: effortColor[s.effort] ?? '#76828F' }}
                          />
                        )}
                      </span>
                    ))}
                  </p>
                  {b.notes && <p className="mt-2 font-ui text-meta text-ink-faint">{b.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
