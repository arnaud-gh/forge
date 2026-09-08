import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, IconButton, CloseIcon } from '@/components';
import {
  countExercises,
  estimateSessionSeconds,
  exerciseName,
  resolveSession,
  useProgramStore,
} from '@/features/program';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';
import { usePlayerStore, type PlanProgression, type WorkoutContext } from '@/features/player';
import { computePlanProgression, getLastWorkoutForSession } from './history';
import { formatBlockTarget } from './format';
import { RecommendationChip } from './RecommendationChip';
import { minutesOf } from '@/features/home/homeData';

// Pre-session overview (WRK-1). Loads previous performance to pre-fill weights and
// show recommendations (PROG-1..8), then starts the workout and enters the player.
export function PreSessionOverview() {
  const { t } = useTranslation(['player', 'common']);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const program = useProgramStore((s) => s.program);
  const start = usePlayerStore((s) => s.start);

  const state = (location.state ?? {}) as { weekIndex?: number; standalone?: boolean };
  const sessionId = params.sessionId ?? '';
  const isStandalone = state.standalone ?? false;
  const weekIndex = state.weekIndex ?? 1;

  const resolved = useMemo(
    () => (program ? resolveSession(program, sessionId, weekIndex) : null),
    [program, sessionId, weekIndex],
  );

  const [plan, setPlan] = useState<PlanProgression>({});
  useEffect(() => {
    if (!resolved || isStandalone) return; // standalone sessions carry no progression (assumption 8)
    let cancelled = false;
    void (async () => {
      const last = await getLastWorkoutForSession(sessionId);
      if (!cancelled) setPlan(computePlanProgression(resolved, last));
    })();
    return () => {
      cancelled = true;
    };
  }, [resolved, sessionId, isStandalone]);

  if (!program || !resolved) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-app">
        <EmptyState title={t('player:title')} body={t('player:body')} />
      </div>
    );
  }

  const minutes = minutesOf(estimateSessionSeconds(resolved, DEFAULT_SETTINGS.timers));
  const exercises = countExercises(resolved);

  const onStart = () => {
    const context: WorkoutContext = {
      programId: program.programId,
      sessionId,
      sessionName: resolved.name,
      weekIndex: isStandalone ? null : weekIndex,
      isStandalone,
    };
    start(resolved, context, DEFAULT_SETTINGS.timers, plan);
    navigate('/player');
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-app pt-safe">
      <div className="flex justify-end px-gutter pt-3">
        <IconButton
          label={t('common:actions.close')}
          onClick={() => navigate(-1)}
          className="border-0"
        >
          <CloseIcon />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-gutter pb-8">
        <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
          {t('player:overviewKicker')}
        </p>
        <h1 className="mt-1 font-display text-display-lg uppercase leading-none text-ink">
          {resolved.name}
        </h1>
        <p className="mb-6 mt-2 font-ui text-meta text-ink-muted">
          {t('player:estimate', { min: minutes, count: exercises })}
        </p>

        <div className="space-y-6">
          {resolved.sections.map((section) => (
            <section key={section.id}>
              <h2 className="mb-2 font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
                {section.name}
              </h2>
              <ul className="space-y-2">
                {section.blocks.map((block) => {
                  const prog = plan[block.id];
                  const first = block.sets[0];
                  const prefill = prog?.prefillWeights[0] ?? first?.weightKg;
                  return (
                    <li key={block.id} className="rounded-sm border border-line px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-display-xs uppercase text-ink">
                          {exerciseName(program, block.exerciseId)}
                        </p>
                        {first && (
                          <RecommendationChip
                            kind={prog?.kind}
                            target={first}
                            assisted={block.assisted ?? false}
                          />
                        )}
                      </div>
                      <p className="mt-1 font-ui text-meta text-ink-muted">
                        {formatBlockTarget(block.sets)}
                        {prefill !== undefined && prefill !== null && first?.weightKg === undefined
                          ? ` @ ${prefill} kg`
                          : ''}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="border-t border-line bg-app px-gutter pb-safe pt-3">
        <Button variant="primary" onClick={onStart}>
          {t('player:start')}
        </Button>
      </div>
    </div>
  );
}
