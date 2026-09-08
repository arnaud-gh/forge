import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EffortSelector, GigaTimer, Stepper, type Effort } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { elapsedMs, isExpired, remainingMs, remainingSeconds } from '@/lib/timers';
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
  const isRestPause = target.type === 'restPause';
  const isDuration = target.type === 'duration';
  const isAmrap = target.type === 'amrap';
  const hasWeight = target.weightKg !== undefined || step.assisted;

  // reps doubles as CHUNKS for rest-pause.
  const [weight, setWeight] = useState(target.weightKg ?? 0);
  const [reps, setReps] = useState(isAmrap ? 0 : isRestPause ? 1 : targetReps(target));
  useEffect(() => {
    setWeight(target.weightKg ?? 0);
    setReps(target.type === 'amrap' ? 0 : target.type === 'restPause' ? 1 : targetReps(target));
  }, [step.key, target]);

  // Rest-pause runs a stopwatch (count up); everything else is a countdown.
  const stopwatch = isRestPause;
  const displaySeconds = setTimer
    ? stopwatch
      ? Math.floor(elapsedMs(setTimer, now) / 1000)
      : remainingSeconds(setTimer, now)
    : 0;
  const progress =
    setTimer && !stopwatch && setTimer.durationMs > 0
      ? 1 - remainingMs(setTimer, now) / setTimer.durationMs
      : undefined;
  const expired = !stopwatch && setTimer ? isExpired(setTimer, now) : false;

  useEffect(() => {
    if (expired && 'vibrate' in navigator) navigator.vibrate?.(180);
  }, [expired]);

  const name = program ? exerciseName(program, step.exerciseId) : step.exerciseId;

  const caption = !step.logged
    ? t('caption.warmup')
    : isRestPause
      ? t('caption.total', { n: target.type === 'restPause' ? target.totalReps : 0 })
      : isAmrap
        ? t('caption.amrap')
        : expired
          ? t('timesUp')
          : t('caption.setTime');

  const letter = String.fromCharCode(65 + step.sectionBlockIndex);
  const label =
    step.sectionType === 'circuit'
      ? t('kicker.round', {
          r: step.round,
          total: step.totalRounds,
          n: step.sectionBlockIndex + 1,
          total_sets: step.sectionBlockCount,
        })
      : step.sectionType === 'superset'
        ? t('kicker.superset', { letter, n: step.setIndex + 1, total: step.setCount })
        : t('kicker.set', { n: step.setIndex + 1, total: step.setCount });

  const logWithEffort = (effort: Effort) => {
    if (isRestPause) {
      logCurrentSet({
        ...(hasWeight ? { weightKg: weight } : {}),
        chunks: reps,
        reps: target.type === 'restPause' ? target.totalReps : undefined,
        seconds: setTimer ? Math.floor(elapsedMs(setTimer, Date.now()) / 1000) : undefined,
        effort,
      });
    } else {
      logCurrentSet({ ...(hasWeight ? { weightKg: weight } : {}), reps, effort });
    }
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
              seconds={displaySeconds}
              variant="set"
              progress={progress}
              caption={caption}
              pulse={!paused && !stopwatch && displaySeconds <= 5 && displaySeconds > 0}
            />
          ) : (
            <p className="text-center font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
              {caption}
            </p>
          )}
        </div>

        {step.logged && setTimer && !stopwatch && (
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
                label={isRestPause ? t('field.chunks') : t('field.reps')}
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
