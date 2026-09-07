import { describe, expect, it } from 'vitest';
import {
  addTime,
  createTimer,
  elapsedMs,
  isExpired,
  isRunning,
  pause,
  remainingMs,
  remainingSeconds,
  restart,
  resume,
} from './timers';

const T0 = 1_000_000; // arbitrary epoch base

describe('timers', () => {
  it('derives remaining time from timestamps while running', () => {
    const t = createTimer(90_000, T0);
    expect(remainingMs(t, T0)).toBe(90_000);
    expect(remainingMs(t, T0 + 30_000)).toBe(60_000);
    expect(remainingSeconds(t, T0 + 30_000)).toBe(60);
  });

  it('clamps remaining at zero and reports expiry', () => {
    const t = createTimer(90_000, T0);
    expect(remainingMs(t, T0 + 90_000)).toBe(0);
    expect(remainingMs(t, T0 + 120_000)).toBe(0);
    expect(isExpired(t, T0 + 89_999)).toBe(false);
    expect(isExpired(t, T0 + 90_000)).toBe(true);
  });

  it('freezes elapsed while paused and continues on resume', () => {
    let t = createTimer(90_000, T0);
    t = pause(t, T0 + 20_000); // 20s elapsed, frozen
    expect(isRunning(t)).toBe(false);
    // Time passes while paused; remaining must not change.
    expect(remainingMs(t, T0 + 20_000)).toBe(70_000);
    expect(remainingMs(t, T0 + 999_999)).toBe(70_000);

    t = resume(t, T0 + 100_000); // resume much later
    expect(isRunning(t)).toBe(true);
    // Only running time counts: 20s before + 10s after resume = 30s elapsed.
    expect(remainingMs(t, T0 + 110_000)).toBe(60_000);
  });

  it('is correct after the app was backgrounded and reopened (no drift)', () => {
    // A 90s timer started, then the app is backgrounded for 200s of real time.
    const t = createTimer(90_000, T0);
    const afterBackground = T0 + 200_000;
    // Real elapsed exceeds duration, so it reads as fully expired, not a stale value.
    expect(elapsedMs(t, afterBackground)).toBe(200_000);
    expect(remainingMs(t, afterBackground)).toBe(0);
    expect(isExpired(t, afterBackground)).toBe(true);
  });

  it('restart resets elapsed to full duration', () => {
    let t = createTimer(75_000, T0);
    t = restart(t, T0 + 40_000);
    expect(remainingMs(t, T0 + 40_000)).toBe(75_000);
    expect(remainingMs(t, T0 + 55_000)).toBe(60_000);
  });

  it('addTime extends the duration (+15s / bonus rest)', () => {
    let t = createTimer(90_000, T0);
    t = addTime(t, 15_000);
    expect(remainingMs(t, T0)).toBe(105_000);
    // Bonus rest can be negative-safe: never below zero duration.
    t = addTime(t, -1_000_000);
    expect(t.durationMs).toBe(0);
  });

  it('pause and resume are idempotent', () => {
    let t = createTimer(60_000, T0);
    const running = resume(t, T0 + 5_000);
    expect(running).toEqual(t); // already running
    t = pause(t, T0 + 10_000);
    const paused = pause(t, T0 + 20_000);
    expect(paused).toEqual(t); // already paused
  });
});
