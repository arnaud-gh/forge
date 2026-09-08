import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GigaTimer, formatClock } from '@/components';
import { cueBreath, cueGong } from '@/lib/audio';
import { vibrate } from '@/lib/haptics';
import { keepWakeLockOnVisibility, releaseWakeLock, requestWakeLock } from '@/lib/wakeLock';
import { useNow } from '@/features/player/useNow';
import { useBreathingStore } from './breathingStore';
import { breathScale, breathingDurationMs, currentBreath } from './machine';
import { Hexagon } from './Hexagon';
import { BreathingSummary } from './BreathingSummary';

const DOUBLE_TAP_MS = 350;

/**
 * Full-screen breathing session (BR-5..9). Phases are timestamp-based; the UI
 * derives the live breath count, hexagon scale and stopwatch from `now`.
 */
export function BreathingSessionScreen() {
  const { t } = useTranslation('breathe');
  const phase = useBreathingStore((s) => s.phase);
  const round = useBreathingStore((s) => s.round);
  const config = useBreathingStore((s) => s.config);
  const audio = useBreathingStore((s) => s.audio);
  const recoveryHoldSec = useBreathingStore((s) => s.recoveryHoldSec);
  const phaseStartedAt = useBreathingStore((s) => s.phaseStartedAt);
  const retentions = useBreathingStore((s) => s.retentions);
  const toRetention = useBreathingStore((s) => s.toRetention);
  const endRetention = useBreathingStore((s) => s.endRetention);
  const endRecovery = useBreathingStore((s) => s.endRecovery);
  const finishEarly = useBreathingStore((s) => s.finishEarly);

  const running = phase === 'breathing' || phase === 'retention' || phase === 'recovery';
  const now = useNow(running);
  const elapsedMs = Math.max(0, now - phaseStartedAt);
  const elapsedSec = Math.floor(elapsedMs / 1000);

  const [sessionStartedAt] = useState(() => Date.now());

  // Wake lock for the whole session.
  useEffect(() => {
    void requestWakeLock();
    const stop = keepWakeLockOnVisibility();
    return () => {
      stop();
      void releaseWakeLock();
    };
  }, []);

  // Gong + haptic on phase transitions (BR-7/8).
  useEffect(() => {
    if (phase === 'retention' || phase === 'recovery') {
      if (audio.gong) cueGong();
      if (audio.haptic) vibrate([120, 60, 120]);
    }
  }, [phase, round, audio.gong, audio.haptic]);

  // Breath tick + light haptic on each new breath (BR-6).
  const breath = phase === 'breathing' ? currentBreath(config, elapsedMs) : 0;
  const lastBreath = useRef(0);
  useEffect(() => {
    if (phase !== 'breathing') {
      lastBreath.current = 0;
      return;
    }
    if (breath !== lastBreath.current) {
      lastBreath.current = breath;
      if (audio.breathingSounds) cueBreath();
      if (audio.haptic) vibrate(20);
    }
  }, [breath, phase, audio.breathingSounds, audio.haptic]);

  // Auto transitions: last breath -> retention; recovery countdown -> next.
  const advanced = useRef<string>('');
  useEffect(() => {
    const key = `${phase}:${round}`;
    if (
      phase === 'breathing' &&
      elapsedMs >= breathingDurationMs(config) &&
      advanced.current !== key
    ) {
      advanced.current = key;
      toRetention();
    }
    if (phase === 'recovery' && elapsedSec >= recoveryHoldSec && advanced.current !== key) {
      advanced.current = key;
      if (audio.gong) cueGong();
      endRecovery();
    }
  }, [
    phase,
    round,
    elapsedMs,
    elapsedSec,
    config,
    recoveryHoldSec,
    toRetention,
    endRecovery,
    audio.gong,
  ]);

  // Double tap: breathing -> retention, retention -> recovery (BR-6/7).
  const lastTap = useRef(0);
  const onTap = () => {
    const t0 = Date.now();
    const isDouble = t0 - lastTap.current < DOUBLE_TAP_MS;
    lastTap.current = t0;
    if (!isDouble) return;
    if (phase === 'breathing') toRetention();
    else if (phase === 'retention') endRetention(elapsedSec);
  };

  if (phase === 'idle') return <Navigate to="/breathe" replace />;
  if (phase === 'summary') return <BreathingSummary startedAt={sessionStartedAt} />;

  const scale =
    phase === 'breathing' ? (audio.visualFeedback ? breathScale(config, elapsedMs) : 0.75) : 0.55;
  const previous = retentions[retentions.length - 1];

  return (
    <div className="flex h-[100dvh] flex-col bg-deep pt-safe">
      <div className="flex items-center justify-between px-gutter pt-3">
        <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
          {t('session.round', { r: round, total: config.rounds })}
        </span>
        <button
          type="button"
          onClick={() => finishEarly(phase === 'retention' ? elapsedSec : null)}
          className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
        >
          {t('session.finish')}
        </button>
      </div>

      <button
        type="button"
        onClick={onTap}
        className="flex flex-1 flex-col items-center justify-center px-gutter text-center"
      >
        {phase === 'breathing' && (
          <>
            <p className="mb-8 font-ui text-label-sm uppercase tracking-[0.14em] text-breath">
              {t('session.breathe')}
            </p>
            {audio.visualFeedback ? (
              <Hexagon scale={scale}>
                <span className="font-display text-timer-md tabular-nums text-ink">{breath}</span>
              </Hexagon>
            ) : (
              <span className="font-display text-timer-md tabular-nums text-ink">{breath}</span>
            )}
          </>
        )}

        {phase === 'retention' && (
          <>
            <p className="mb-8 font-ui text-label-sm uppercase tracking-[0.14em] text-breath">
              {t('session.letGo')}
            </p>
            {audio.visualFeedback && <Hexagon scale={0.55} dim />}
            <div className="mt-6">
              <GigaTimer seconds={elapsedSec} variant="breath" caption={t('session.retention')} />
            </div>
            {previous !== undefined && (
              <p className="mt-4 font-ui text-meta text-ink-muted">
                {t('session.previous', { time: formatClock(previous) })}
              </p>
            )}
          </>
        )}

        {phase === 'recovery' && (
          <>
            <p className="mb-8 font-ui text-label-sm uppercase tracking-[0.14em] text-breath">
              {t('session.recovery')}
            </p>
            <GigaTimer
              seconds={Math.max(0, recoveryHoldSec - elapsedSec)}
              variant="breath"
              progress={Math.min(1, elapsedSec / recoveryHoldSec)}
            />
          </>
        )}
      </button>

      <p className="px-gutter pb-safe pt-2 text-center font-ui text-meta text-ink-ghost">
        {phase === 'breathing'
          ? t('session.hintRetention')
          : phase === 'retention'
            ? t('session.hintRecovery')
            : ''}
      </p>
    </div>
  );
}
