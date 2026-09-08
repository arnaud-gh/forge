import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { keepWakeLockOnVisibility, releaseWakeLock, requestWakeLock } from '@/lib/wakeLock';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Dialog } from '@/components';
import { completeCue } from './cues';

// DESIGN.md motion: the logged set exits down 24px and fades (duration-screen,
// ease-exit); the next screen enters from opacity 0, y +16 (duration-phase).
const phaseVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, y: 24, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
} as const;
import { useProgramStore } from '@/features/program';
import { usePlayerStore } from './playerStore';
import { useNow } from './useNow';
import { PlayerTopBar } from './PlayerTopBar';
import { SetView } from './SetView';
import { RestView } from './RestView';
import { PrepView } from './PrepView';
import { SessionListSheet } from './SessionListSheet';
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
  const notes = usePlayerStore((s) => s.notes);
  const context = usePlayerStore((s) => s.context);
  const startedAt = usePlayerStore((s) => s.startedAt);
  const finish = usePlayerStore((s) => s.finish);
  const discard = usePlayerStore((s) => s.discard);
  const resumeWorkout = usePlayerStore((s) => s.resumeWorkout);

  const markSessionDone = useProgramStore((s) => s.markSessionDone);
  const saveOverlay = useProgramStore((s) => s.saveOverlay);
  const changes = usePlayerStore((s) => s.changes);

  const [confirmClose, setConfirmClose] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = useNow(active && !paused && phase !== 'summary');

  // Completion cue when the summary is reached (WRK-23).
  useEffect(() => {
    if (phase === 'summary') completeCue();
  }, [phase]);

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

  const onSave = async (note: string, keep: Record<string, boolean>) => {
    if (!context) return;
    setSaving(true);
    try {
      const workout = assembleWorkout(context, steps, logs, notes, startedAt, Date.now());
      if (note.trim()) workout.note = note.trim();
      await persistWorkout(workout);
      if (!context.isStandalone && context.weekIndex !== null) {
        await markSessionDone(context.weekIndex, context.sessionId);
      }
      // Kept changes go into the program overlay for this sessionId (WRK-22, PRG-7).
      const kept = {
        swaps: Object.fromEntries(
          Object.entries(changes.swaps)
            .filter(([b]) => keep[`swap:${b}`] !== false)
            .map(([b, s]) => [b, s.to]),
        ),
        removedBlocks: changes.removedBlocks.filter((b) => keep[`remove:${b}`] !== false),
        addedBlocks: changes.addedBlocks.filter((a) => keep[`add:${a.block.id}`] !== false),
        setCounts: Object.fromEntries(
          Object.entries(changes.setCounts)
            .filter(([b]) => keep[`sets:${b}`] !== false)
            .map(([b, c]) => [b, c.to]),
        ),
      };
      const hasKept =
        Object.keys(kept.swaps).length +
          kept.removedBlocks.length +
          kept.addedBlocks.length +
          Object.keys(kept.setCounts).length >
        0;
      if (hasKept && !context.isStandalone) await saveOverlay(context.sessionId, kept);
      await discard(); // clears the in-progress record
      navigate('/', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  if (phase === 'summary') {
    return <SummaryView onSave={(note, keep) => void onSave(note, keep)} saving={saving} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-app pt-safe">
      <PlayerTopBar
        now={now}
        onClose={() => setConfirmClose(true)}
        onOpenList={() => setListOpen(true)}
      />
      <SessionListSheet open={listOpen} onClose={() => setListOpen(false)} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${phase}:${step?.key ?? ''}`}
          className="flex min-h-0 flex-1 flex-col"
          variants={phaseVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {phase === 'prep' && step ? <PrepView step={step} now={now} /> : null}
          {phase === 'set' && step ? <SetView step={step} now={now} /> : null}
          {phase === 'rest' ? <RestView now={now} /> : null}
        </motion.div>
      </AnimatePresence>

      {paused && (
        <div className="absolute inset-0 z-scrim flex flex-col items-center justify-center bg-black/85 px-gutter">
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
