import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { keepWakeLockOnVisibility, releaseWakeLock, requestWakeLock } from '@/lib/wakeLock';
import { useTranslation } from 'react-i18next';
import { Button, Dialog } from '@/components';
import { useProgramStore } from '@/features/program';
import { usePlayerStore } from './playerStore';
import { useNow } from './useNow';
import { PlayerTopBar } from './PlayerTopBar';
import { SetView } from './SetView';
import { RestView } from './RestView';
import { SummaryView } from './SummaryView';
import { assembleWorkout, plannedSetCount } from './sequencer';
import { persistWorkout } from './saveWorkout';

/**
 * Full-screen workout player (PRD section 6). Routes by phase, handles the
 * global pause overlay (WRK-18), the close/finish confirmation (WRK-3/19), and
 * saving on the summary (WRK-21).
 */
export function PlayerScreen() {
  const { t } = useTranslation('player');
  const navigate = useNavigate();

  const active = usePlayerStore((s) => s.active);
  const phase = usePlayerStore((s) => s.phase);
  const paused = usePlayerStore((s) => s.paused);
  const step = usePlayerStore((s) => s.currentStep());
  const steps = usePlayerStore((s) => s.steps);
  const logs = usePlayerStore((s) => s.logs);
  const context = usePlayerStore((s) => s.context);
  const startedAt = usePlayerStore((s) => s.startedAt);
  const finish = usePlayerStore((s) => s.finish);
  const discard = usePlayerStore((s) => s.discard);
  const resumeWorkout = usePlayerStore((s) => s.resumeWorkout);

  const markSessionDone = useProgramStore((s) => s.markSessionDone);

  const [confirmClose, setConfirmClose] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = useNow(active && !paused && phase !== 'summary');

  // Keep the screen awake for the duration of the player (WRK-20).
  useEffect(() => {
    void requestWakeLock();
    const stop = keepWakeLockOnVisibility();
    return () => {
      stop();
      void releaseWakeLock();
    };
  }, []);

  if (!active) return <Navigate to="/" replace />;

  const remaining =
    plannedSetCount(steps) - Object.values(logs).filter((l) => l.status === 'done').length;

  const onSave = async (note: string) => {
    if (!context) return;
    setSaving(true);
    try {
      const workout = assembleWorkout(context, steps, logs, startedAt, Date.now());
      if (note.trim()) workout.note = note.trim();
      await persistWorkout(workout);
      if (!context.isStandalone && context.weekIndex !== null) {
        await markSessionDone(context.weekIndex, context.sessionId);
      }
      await discard(); // clears the in-progress record
      navigate('/', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  if (phase === 'summary') {
    return <SummaryView onSave={(note) => void onSave(note)} saving={saving} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-app pt-safe">
      <PlayerTopBar now={now} onClose={() => setConfirmClose(true)} />

      {phase === 'set' && step ? <SetView step={step} now={now} /> : null}
      {phase === 'rest' ? <RestView now={now} /> : null}

      {paused && (
        <div className="absolute inset-0 z-scrim flex flex-col items-center justify-center bg-black/60 px-gutter">
          <p className="font-display text-display-lg uppercase text-ink">{t('paused')}</p>
          <div className="mt-8 w-full max-w-[240px]">
            <Button variant="primary" onClick={resumeWorkout}>
              {t('action.resume')}
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={confirmClose}
        title={t('confirm.finishTitle')}
        body={remaining > 0 ? t('confirm.finishBody', { n: remaining }) : undefined}
        cancelLabel={t('confirm.keepGoing')}
        confirmLabel={t('confirm.finishNow')}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          finish();
        }}
      />
    </div>
  );
}
