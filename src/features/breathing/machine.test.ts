import { describe, expect, it } from 'vitest';
import {
  averageRetention,
  bestRetention,
  breathScale,
  breathingDurationMs,
  currentBreath,
  type BreathingConfig,
} from './machine';

const config: BreathingConfig = {
  speed: 'standard',
  inhaleSec: 3,
  exhaleSec: 3,
  rounds: 3,
  breaths: 30,
};

describe('breathing machine', () => {
  it('computes total breathing duration', () => {
    // 30 breaths * (3+3)s = 180s
    expect(breathingDurationMs(config)).toBe(180_000);
  });

  it('tracks the current breath, clamped to the count', () => {
    expect(currentBreath(config, 0)).toBe(1);
    expect(currentBreath(config, 6_000)).toBe(2); // one full breath done
    expect(currentBreath(config, 999_000)).toBe(30); // clamped
  });

  it('scales the shape up on inhale and down on exhale', () => {
    expect(breathScale(config, 0)).toBeCloseTo(0.55, 2); // start of inhale
    expect(breathScale(config, 3_000)).toBeCloseTo(1.0, 2); // end of inhale
    expect(breathScale(config, 6_000 - 1)).toBeCloseTo(0.55, 1); // end of exhale
  });

  it('computes average and best retention', () => {
    expect(averageRetention([60, 90, 120])).toBe(90);
    expect(bestRetention([60, 90, 120])).toBe(120);
    expect(averageRetention([])).toBe(0);
  });
});
