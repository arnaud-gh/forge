import { describe, expect, it } from 'vitest';
import { formatClock, resolveGigaSize } from './gigaTimer.helpers';

describe('formatClock', () => {
  it('formats mm:ss under an hour', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(750)).toBe('12:30');
  });

  it('formats h:mm:ss past an hour', () => {
    expect(formatClock(3735)).toBe('1:02:15');
    expect(formatClock(3600)).toBe('1:00:00');
  });

  it('floors and never goes negative', () => {
    expect(formatClock(-10)).toBe('0:00');
    expect(formatClock(89.9)).toBe('1:29');
  });
});

describe('resolveGigaSize (DESIGN.md size clamp)', () => {
  it('keeps the base size for values up to 4 characters', () => {
    expect(resolveGigaSize('rest', '1:30')).toBe('text-timer-xl');
    expect(resolveGigaSize('set', '0:45')).toBe('text-timer-lg');
    expect(resolveGigaSize('breath', '2:08')).toBe('text-timer-md');
  });

  it('steps down one size from 5 characters', () => {
    expect(resolveGigaSize('rest', '12:30')).toBe('text-timer-lg');
    expect(resolveGigaSize('set', '12:30')).toBe('text-timer-md');
    expect(resolveGigaSize('rest', '1:02:15')).toBe('text-timer-lg');
  });

  it('never shrinks the breath stopwatch below timer-md', () => {
    expect(resolveGigaSize('breath', '1:02:15')).toBe('text-timer-md');
  });
});
