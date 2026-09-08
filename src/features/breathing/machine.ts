import type { BreathingSpeed, BreathingSettings } from '@/features/settings/types';

// Breathing session math (BR-6/7/8). Pure and time-injectable; the store holds
// timestamps and the UI derives the live values with requestAnimationFrame.

export type BreathingPhase = 'idle' | 'breathing' | 'retention' | 'recovery' | 'summary';

export interface BreathingConfig {
  speed: BreathingSpeed;
  inhaleSec: number;
  exhaleSec: number;
  rounds: number;
  breaths: number;
}

/** One breath is an inhale then an exhale. */
export function breathDurationMs(config: BreathingConfig): number {
  return (config.inhaleSec + config.exhaleSec) * 1000;
}

/** Total breathing-phase duration for all breaths in a round. */
export function breathingDurationMs(config: BreathingConfig): number {
  return breathDurationMs(config) * config.breaths;
}

/** Current breath number (1-based), clamped to the configured count. */
export function currentBreath(config: BreathingConfig, elapsedMs: number): number {
  const n = Math.floor(elapsedMs / breathDurationMs(config)) + 1;
  return Math.min(config.breaths, Math.max(1, n));
}

/**
 * Hexagon scale for the current instant: 0.55 (empty) to 1.0 (full), rising over
 * the inhale and falling over the exhale (DESIGN.md breathing shape).
 */
export function breathScale(config: BreathingConfig, elapsedMs: number): number {
  const within = elapsedMs % breathDurationMs(config);
  const inhaleMs = config.inhaleSec * 1000;
  const MIN = 0.55;
  const MAX = 1.0;
  if (within <= inhaleMs) {
    return MIN + (MAX - MIN) * (within / inhaleMs);
  }
  const exhaleProgress = (within - inhaleMs) / (config.exhaleSec * 1000);
  return MAX - (MAX - MIN) * exhaleProgress;
}

export function speedDurations(
  settings: BreathingSettings,
  speed: BreathingSpeed,
): { inhaleSec: number; exhaleSec: number } {
  const preset = settings.presets[speed];
  return { inhaleSec: preset.inhaleSec, exhaleSec: preset.exhaleSec };
}

export function averageRetention(retentions: number[]): number {
  if (retentions.length === 0) return 0;
  return Math.round(retentions.reduce((a, b) => a + b, 0) / retentions.length);
}

export function bestRetention(retentions: number[]): number {
  return retentions.length === 0 ? 0 : Math.max(...retentions);
}
