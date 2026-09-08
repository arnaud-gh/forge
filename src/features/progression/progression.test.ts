import { describe, expect, it } from 'vitest';
import type { ProgramSet } from '@/features/program';
import { computeProgression, type PreviousSet } from './progression';

const range: ProgramSet = { type: 'repRange', min: 8, max: 10, weightKg: 60 };

function input(history: PreviousSet[] | null, overrides = {}) {
  return { target: range, currentSetCount: 3, plannedWeightKg: 60, history, ...overrides };
}

describe('computeProgression', () => {
  it('first occurrence: no chip, planned weight pre-filled (PROG-7)', () => {
    const p = computeProgression(input(null));
    expect(p.kind).toBe('none');
    expect(p.prefillWeights).toEqual([60, 60, 60]);
  });

  it('increase when every set hit max reps and none was max effort (PROG-2)', () => {
    const history: PreviousSet[] = [
      { weightKg: 60, reps: 10, effort: 'ideal' },
      { weightKg: 60, reps: 10, effort: 'ideal' },
      { weightKg: 60, reps: 10, effort: 'ideal' },
    ];
    expect(computeProgression(input(history)).kind).toBe('increase');
  });

  it('holds when max reps were hit but at max effort (PROG-3)', () => {
    const history: PreviousSet[] = [
      { weightKg: 60, reps: 10, effort: 'ideal' },
      { weightKg: 60, reps: 10, effort: 'max' },
    ];
    expect(computeProgression(input(history)).kind).toBe('hold');
  });

  it('holds when reps were inside the range (PROG-3)', () => {
    const history: PreviousSet[] = [
      { weightKg: 60, reps: 9, effort: 'ideal' },
      { weightKg: 60, reps: 9, effort: 'ideal' },
    ];
    expect(computeProgression(input(history)).kind).toBe('hold');
  });

  it('below range when any set dropped under the minimum (PROG-4)', () => {
    const history: PreviousSet[] = [
      { weightKg: 60, reps: 7, effort: 'max' },
      { weightKg: 60, reps: 9, effort: 'ideal' },
    ];
    expect(computeProgression(input(history)).kind).toBe('below');
  });

  it('pre-fills weight per set index, falling back to the last weight used (PROG-1)', () => {
    const history: PreviousSet[] = [
      { weightKg: 60, reps: 10 },
      { weightKg: 62.5, reps: 9 },
    ];
    const p = computeProgression(input(history, { currentSetCount: 4 }));
    expect(p.prefillWeights).toEqual([60, 62.5, 62.5, 62.5]);
    expect(p.baselineWeight).toBe(60);
  });

  it('no recommendation for non-rep sets (PROG-6)', () => {
    const amrap: ProgramSet = { type: 'amrap', seconds: 40 };
    const p = computeProgression({ target: amrap, currentSetCount: 1, history: [{ reps: 20 }] });
    expect(p.kind).toBe('none');
  });

  it('no recommendation for bodyweight blocks (PROG-6)', () => {
    const bw: ProgramSet = { type: 'repRange', min: 8, max: 12, bodyweight: true };
    const history: PreviousSet[] = [{ reps: 12 }, { reps: 12 }];
    const p = computeProgression({ target: bw, currentSetCount: 2, history });
    expect(p.kind).toBe('none');
  });

  it('handles fixed-rep targets (reps type)', () => {
    const reps: ProgramSet = { type: 'reps', reps: 10, weightKg: 40 };
    const hit: PreviousSet[] = [{ weightKg: 40, reps: 10, effort: 'ideal' }];
    const missed: PreviousSet[] = [{ weightKg: 40, reps: 8, effort: 'ideal' }];
    expect(
      computeProgression({ target: reps, currentSetCount: 1, plannedWeightKg: 40, history: hit })
        .kind,
    ).toBe('increase');
    expect(
      computeProgression({ target: reps, currentSetCount: 1, plannedWeightKg: 40, history: missed })
        .kind,
    ).toBe('below');
  });
});
