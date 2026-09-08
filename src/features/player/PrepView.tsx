import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GigaTimer } from '@/components';
import { exerciseName, useProgramStore } from '@/features/program';
import { isExpired, remainingMs, remainingSeconds } from '@/lib/timers';
import { usePlayerStore } from './playerStore';
import { UndoBanner } from './UndoBanner';
import type { SetStep } from './types';

type PrepViewProps = { step: SetStep; now: number };

// Prep countdown before the first set of a block (WRK-11).
export function PrepView({ step, now }: PrepViewProps) {
  const { t } = useTranslation('player');
  const program = useProgramStore((s) => s.program);
  const prepTimer = usePlayerStore((s) => s.prepTimer);
  const paused = usePlayerStore((s) => s.paused);
  const beginSet = usePlayerStore((s) => s.beginSet);
  const addPrep = usePlayerStore((s) => s.addPrep);

  const remaining = prepTimer ? remainingSeconds(prepTimer, now) : 0;
  const progress =
    prepTimer && prepTimer.durationMs > 0
      ? 1 - remainingMs(prepTimer, now) / prepTimer.durationMs
      : 0;
  const expired = prepTimer ? isExpired(prepTimer, now) : false;

  const started = useRef(false);
  useEffect(() => {
    if (expired && !paused && !started.current) {
      started.current = true;
      beginSet();
    }
  }, [expired, paused, beginSet]);

  const name = program ? exerciseName(program, step.exerciseId) : step.exerciseId;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-gutter">
        <p className="mb-6 font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
          {t('caption.prep')}
        </p>
        <GigaTimer
          seconds={remaining}
          variant="set"
          progress={progress}
          caption={t('caption.getReady')}
        />
        <p className="mt-8 font-ui text-body text-ink-muted">{t('prepNext', { name })}</p>
        <UndoBanner />
      </div>
      <div className="border-t border-line bg-app px-gutter pb-safe pt-3">
        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => addPrep(30)}>
            {t('addPrep')}
          </Button>
          <Button variant="primary" size="md" onClick={beginSet}>
            {t('startSet')}
          </Button>
        </div>
      </div>
    </div>
  );
}
