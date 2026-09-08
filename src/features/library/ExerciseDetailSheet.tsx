import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Sheet } from '@/components';
import { useProgramStore } from '@/features/program';
import {
  exerciseOccurrences,
  fetchRecentWorkouts,
  type ExerciseOccurrence,
} from '@/features/history/workouts';
import { resolveExercise, type Exercise } from './exercises';
import { ExerciseImage } from './ExerciseImage';

type Props = { exerciseId: string | null; onClose: () => void };

const effortColor: Record<string, string> = {
  easy: '#8FB3CC',
  ideal: '#FFB000',
  max: '#FF5C33',
};

// Exercise detail sheet (LIB-4): images, instructions, equipment, muscles, and
// the exercise history with a max-weight chart (HIST-3).
export function ExerciseDetailSheet({ exerciseId, onClose }: Props) {
  const { t } = useTranslation(['library', 'common']);
  const program = useProgramStore((s) => s.program);
  const [history, setHistory] = useState<ExerciseOccurrence[]>([]);

  const exercise: Exercise | null = exerciseId ? resolveExercise(program, exerciseId) : null;

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    void fetchRecentWorkouts(100).then((ws) => {
      if (!cancelled) setHistory(exerciseOccurrences(ws, exerciseId));
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const chart = history
    .filter((h) => h.maxWeightKg !== null)
    .map((h) => ({ date: h.date, kg: h.maxWeightKg as number }));

  return (
    <Sheet
      open={exerciseId !== null}
      onClose={onClose}
      title={exercise?.name ?? ''}
      closeLabel={t('common:actions.close')}
    >
      {exercise && (
        <div className="space-y-6 pb-4">
          {exercise.images.length > 0 && (
            <div className="flex gap-2">
              {exercise.images.slice(0, 2).map((src, i) => (
                <ExerciseImage
                  key={i}
                  exercise={{ ...exercise, images: [src] }}
                  className="aspect-[4/3] w-1/2"
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-1 font-ui text-meta text-ink-muted">
            <span>
              {t('detail.equipment')}:{' '}
              <span className="text-ink-secondary">{exercise.equipment}</span>
            </span>
            <span>
              {t('detail.muscles')}:{' '}
              <span className="text-ink-secondary">
                {[...exercise.primaryMuscles, ...exercise.secondaryMuscles].join(', ')}
              </span>
            </span>
          </div>

          {exercise.instructions.length > 0 && (
            <section>
              <h3 className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                {t('detail.instructions')}
              </h3>
              <ol className="list-decimal space-y-1 pl-5 font-ui text-body text-ink-secondary">
                {exercise.instructions.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <h3 className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
              {t('detail.history')}
            </h3>
            {history.length === 0 ? (
              <p className="font-ui text-meta text-ink-faint">{t('detail.noHistory')}</p>
            ) : (
              <>
                {chart.length > 1 && (
                  <div className="mb-3 h-32 rounded-sm border border-line p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart} margin={{ top: 6, right: 6, bottom: 0, left: -28 }}>
                        <XAxis dataKey="date" hide />
                        <YAxis
                          tick={{ fill: '#76828F', fontSize: 9, fontFamily: 'Archivo' }}
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#10141A',
                            border: '1px solid rgba(200,220,240,0.12)',
                            borderRadius: 4,
                            fontFamily: 'Archivo',
                            fontSize: 12,
                          }}
                          labelFormatter={(d: number) => new Date(d).toLocaleDateString()}
                          formatter={(v: number) => [`${v} kg`, t('detail.maxWeight')]}
                        />
                        <Line
                          type="monotone"
                          dataKey="kg"
                          stroke="#FFB000"
                          strokeWidth={1.5}
                          dot={{ r: 2, fill: '#FFB000', stroke: 'none' }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ul className="space-y-2">
                  {[...history].reverse().map((h) => (
                    <li key={h.workoutId} className="rounded-sm border border-line px-3 py-2">
                      <p className="font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                        {new Date(h.date).toLocaleDateString('en', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {h.sessionName}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-x-3 font-ui text-meta tabular-nums text-ink-secondary">
                        {h.sets.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1">
                            {s.weightKg !== undefined && s.reps !== undefined
                              ? `${s.weightKg}×${s.reps}`
                              : s.reps !== undefined
                                ? `${s.reps}`
                                : s.seconds !== undefined
                                  ? `${s.seconds}s`
                                  : '·'}
                            {s.effort && (
                              <span
                                className="inline-block h-1.5 w-1.5 rounded-full"
                                style={{ background: effortColor[s.effort] ?? '#76828F' }}
                              />
                            )}
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}
