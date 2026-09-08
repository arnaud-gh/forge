import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GigaTimer } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { isExpired, remainingMs, remainingSeconds } from '@/lib/timers';
import { usePlayerStore } from './playerStore';
import { UndoBanner } from './UndoBanner';
import { restCountdownBeep, restEndCue } from './cues';

type RestViewProps = { now: number };

export function RestView({ now }: RestViewProps) {
  const { t } = useTranslation('player');
  const program = useProgramStore((s) => s.program);
  const steps = usePlayerStore((s) => s.steps);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const restTimer = usePlayerStore((s) => s.restTimer);
  const paused = usePlayerStore((s) => s.paused);
  const addRest = usePlayerStore((s) => s.addRest);
  const skipRest = usePlayerStore((s) => s.skipRest);
  const advanceAfterRest = usePlayerStore((s) => s.advanceAfterRest);

  const next = steps[currentIndex + 1];
  const remaining = restTimer ? remainingSeconds(restTimer, now) : 0;
  const progress =
    restTimer && restTimer.durationMs > 0
      ? 1 - remainingMs(restTimer, now) / restTimer.durationMs
      : 0;
  const expired = restTimer ? isExpired(restTimer, now) : false;

  // Auto-advance once when the rest hits zero (WRK-10). Full audio cue in M3.
  const advanced = useRef(false);
  useEffect(() => {
    if (expired && !paused && !advanced.current) {
      advanced.current = true;
      restEndCue();
      advanceAfterRest();
    }
  }, [expired, paused, advanceAfterRest]);

  // Countdown beeps on each of the last 3 seconds (toggleable, default off).
  const lastBeep = useRef(-1);
  useEffect(() => {
    if (paused || remaining > 3 || remaining <= 0 || remaining === lastBeep.current) return;
    lastBeep.current = remaining;
    restCountdownBeep();
  }, [remaining, paused]);

  const nextName = next && program ? exerciseName(program, next.exerciseId) : '';

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-gutter">
        <GigaTimer
          seconds={remaining}
          variant="rest"
          progress={progress}
          caption={t('caption.rest')}
        />
        {next && (
          <p className="mt-8 font-ui text-body text-ink-muted">
            {t('restNext', { name: nextName })}
          </p>
        )}
        <UndoBanner />
      </div>
      <div className="border-t border-line bg-app px-gutter pb-safe pt-3">
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => addRest(15)}>
            {t('action.addRest')}
          </Button>
          <Button variant="primary" size="md" onClick={skipRest}>
            {t('action.skip')}
          </Button>
        </div>
      </div>
    </div>
  );
}
