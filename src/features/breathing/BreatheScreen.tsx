import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Stepper } from '@/components';
import { cn } from '@/lib/cn';
import { unlockAudio } from '@/lib/audio';
import { loadBreathingSetup, saveBreathingSetup } from '@/lib/storage';
import { useSettings } from '@/features/settings/settingsStore';
import type { BreathingSpeed } from '@/features/settings/types';
import { useBreathingStore } from './breathingStore';
import { speedDurations } from './machine';

const SPEEDS: BreathingSpeed[] = ['slow', 'standard', 'fast'];

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between py-3"
    >
      <span className="font-ui text-body text-ink">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-state',
          value ? 'bg-breath' : 'bg-line-emphasis',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-app transition-transform duration-state',
            value ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}

// Breathing setup (BR-1/2/3). bg-deep, breath accent replaces amber.
export function BreatheScreen() {
  const { t } = useTranslation('breathe');
  const navigate = useNavigate();
  const start = useBreathingStore((s) => s.start);
  const live = useSettings();
  const settings = live.breathing;

  const [speed, setSpeed] = useState<BreathingSpeed>('standard');
  const [rounds, setRounds] = useState(3);
  const [breaths, setBreaths] = useState(30);
  const [audioOpen, setAudioOpen] = useState(false);
  const [visualFeedback, setVisualFeedback] = useState(live.audio.visualFeedback);
  const [haptic, setHaptic] = useState(live.audio.hapticFeedback);
  const [gong, setGong] = useState(live.audio.pingGong);
  const [breathingSounds, setBreathingSounds] = useState(live.audio.breathingSounds);

  // Remembered between sessions.
  useEffect(() => {
    void loadBreathingSetup().then((p) => {
      if (!p) return;
      setSpeed(p.speed);
      setRounds(p.rounds);
      setBreaths(p.breaths);
      setVisualFeedback(p.visualFeedback);
      setHaptic(p.haptic);
      setGong(p.gong);
      setBreathingSounds(p.breathingSounds);
    });
  }, []);

  const { inhaleSec, exhaleSec } = speedDurations(settings, speed);

  const onStart = () => {
    unlockAudio();
    void saveBreathingSetup({
      speed,
      rounds,
      breaths,
      visualFeedback,
      haptic,
      gong,
      breathingSounds,
    });
    start({ speed, inhaleSec, exhaleSec, rounds, breaths }, settings.recoveryHoldSeconds, {
      visualFeedback,
      haptic,
      gong,
      breathingSounds,
    });
    navigate('/breathe/session');
  };

  return (
    <div className="min-h-full bg-deep px-gutter pb-8 pt-4">
      <h1 className="mb-6 font-display text-display-md uppercase text-ink">{t('title')}</h1>

      <section className="mb-6">
        <p className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
          {t('setup.speed')}
        </p>
        <div className="flex gap-2">
          {SPEEDS.map((s) => {
            const selected = s === speed;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  'flex h-[60px] flex-1 items-center justify-center rounded-sm border font-display text-btn-sm uppercase',
                  selected
                    ? 'border-breath bg-[var(--breath-dim)] text-breath'
                    : 'border-line-emphasis text-ink',
                )}
              >
                {t(`setup.${s}`)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-ui text-meta text-ink-muted">
          {t('setup.presetInfo', { in: inhaleSec, out: exhaleSec })}
        </p>
      </section>

      <div className="mb-6 flex gap-3">
        <Stepper
          label={t('setup.rounds')}
          value={rounds}
          onChange={setRounds}
          step={1}
          min={1}
          max={5}
          className="flex-1"
        />
        <Stepper
          label={t('setup.breaths')}
          value={breaths}
          onChange={setBreaths}
          step={5}
          min={20}
          max={40}
          className="flex-1"
        />
      </div>

      <section className="mb-8 rounded-sm border border-line px-4">
        <button
          type="button"
          onClick={() => setAudioOpen((v) => !v)}
          className="flex w-full items-center justify-between py-3 font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
        >
          <span>{t('setup.audioTitle')}</span>
          <span>{audioOpen ? '−' : '+'}</span>
        </button>
        {audioOpen && (
          <div className="divide-y divide-line-faint border-t border-line-faint">
            <Toggle
              label={t('setup.visualFeedback')}
              value={visualFeedback}
              onChange={setVisualFeedback}
            />
            <Toggle label={t('setup.hapticFeedback')} value={haptic} onChange={setHaptic} />
            <Toggle label={t('setup.gong')} value={gong} onChange={setGong} />
            <Toggle
              label={t('setup.breathingSounds')}
              value={breathingSounds}
              onChange={setBreathingSounds}
            />
            <p className="py-3 font-ui text-meta text-ink-faint">{t('setup.musicNote')}</p>
          </div>
        )}
      </section>

      <Button variant="primary" onClick={onStart} className="bg-breath text-accent-ink">
        {t('setup.start')}
      </Button>
    </div>
  );
}
