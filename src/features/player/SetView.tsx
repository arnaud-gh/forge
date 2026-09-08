import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EffortSelector, GigaTimer, Stepper, type Effort } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { isExpired, remainingMs, remainingSeconds } from '@/lib/timers';
import { usePlayerStore } from './playerStore';
import { targetReps } from './format';
import type { SetStep } from './types';

type SetViewProps = { step: SetStep; now: number };

export function SetView({ step, now }: SetViewProps) {
  const { t } = useTranslation('player');
  const program = useProgramStore((s) => s.program);
  const setTimer = usePlayerStore((s) => s.setTimer);
  const paused = usePlayerStore((s) => s.paused);
  const logCurrentSet = usePlayerStore((s) => s.logCurrentSet);
  const restartSetTimer = usePlayerStore((s) => s.restartSetTimer);

  const target = step.target;
  const hasWeight = target.weightKg !== undefined || step.assisted;
  const isDuration = target.type === 'duration';
  const isAmrap = target.type === 'amrap';

  // Local, per-step input state (reset when the step changes).
  const [weight, setWeight] = useState(target.weightKg ?? 0);
  const [reps, setReps] = useState(isAmrap ? 0 : targetReps(target));
  useEffect(() => {
    setWeight(target.weightKg ?? 0);
    setReps(target.type === 'amrap' ? 0 : targetReps(target));
  }, [step.key, target]);

  const remaining = setTimer ? remainingSeconds(setTimer, now) : 0;
  const progress =
    setTimer && setTimer.durationMs > 0
      ? 1 - remainingMs(setTimer, now) / setTimer.durationMs
      : undefined;
  const expired = setTimer ? isExpired(setTimer, now) : false;

  // Soft cue when the timer hits zero (WRK-8). Full audio lands in M3.
  useEffect(() => {
    if (expired && 'vibrate' in navigator) navigator.vibrate?.(180);
  }, [expired]);

  const name = program ? exerciseName(program, step.exerciseId) : step.exerciseId;

  const caption = !step.logged
    ? t('caption.warmup')
    : isAmrap
      ? t('caption.amrap')
      : t('caption.setTime');

  const label =
    step.totalRounds > 1
      ? t('kicker.round', {
          r: step.round,
          total: step.totalRounds,
          n: step.setIndex + 1,
          total_sets: step.setCount,
        })
      : t('kicker.set', { n: step.setIndex + 1, total: step.setCount });

  const logWithEffort = (effort: Effort) => {
    logCurrentSet({
      ...(hasWeight ? { weightKg: weight } : {}),
      reps,
      effort,
    });
  };

  const logDone = () => {
    logCurrentSet({
      ...(hasWeight ? { weightKg: weight } : {}),
      ...(isDuration ? { seconds: target.type === 'duration' ? target.seconds : 0 } : {}),
    });
  };

  const effortLabels: Record<Effort, string> = {
    easy: t('effort.easy'),
    ideal: t('effort.ideal'),
    max: t('effort.max'),
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-gutter pt-6">
        <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">{label}</p>
        <h1 className="mt-1 font-display text-display-md uppercase leading-none text-ink">
          {name}
        </h1>

        <div className="mt-8">
          {setTimer ? (
            <GigaTimer
              seconds={remaining}
              variant="set"
              progress={progress}
              caption={expired ? t('timesUp') : caption}
              pulse={!paused && remaining <= 5 && remaining > 0}
            />
          ) : (
            <p className="text-center font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
              {caption}
            </p>
          )}
        </div>

        {step.logged && setTimer && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={restartSetTimer}
              className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
            >
              {t('action.restartSet')}
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-app px-gutter pb-safe pt-3">
        {!step.logged || isDuration ? (
          <Button variant="primary" onClick={logDone}>
            {t('action.done')}
          </Button>
        ) : (
          <>
            <div className="mb-3 flex gap-3">
              {hasWeight && (
                <Stepper
                  label={step.assisted ? t('field.assist') : t('field.weight')}
                  value={weight}
                  onChange={setWeight}
                  step={2.5}
                  min={0}
                  unit="kg"
                  allowDecimalEntry
                  changed={weight !== (target.weightKg ?? 0)}
                  className="flex-1"
                />
              )}
              <Stepper
                label={t('field.reps')}
                value={reps}
                onChange={setReps}
                step={1}
                min={0}
                className="flex-1"
              />
            </div>
            <EffortSelector value={null} onSelect={logWithEffort} labels={effortLabels} />
          </>
        )}
      </div>
    </div>
  );
}
