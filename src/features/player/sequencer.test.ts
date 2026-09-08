import { describe, expect, it } from 'vitest';
import type { Session } from '@/features/program';
import { assembleWorkout, buildSteps, plannedSetCount, setVolume } from './sequencer';
import type { LoggedSet, WorkoutContext } from './types';

const timers = { secondsPerRep: 3, setMarginSeconds: 10, defaultRestSeconds: 90 };

function session(): Session {
  return {
    id: 'sess',
    name: 'Session',
    sections: [
      {
        id: 'warm',
        name: 'Warm up',
        type: 'standard',
        blocks: [
          {
            id: 'wu',
            exerciseId: 'Warmup',
            sets: [{ type: 'duration', seconds: 30, logged: false }],
            restSeconds: 0,
          },
        ],
      },
      {
        id: 'main',
        name: 'Main',
        type: 'standard',
        blocks: [
          {
            id: 'bench',
            exerciseId: 'Bench',
            sets: [
              { type: 'repRange', min: 8, max: 10, weightKg: 60 },
              { type: 'repRange', min: 8, max: 10, weightKg: 60 },
            ],
            restSeconds: 120,
          },
        ],
      },
      {
        id: 'circ',
        name: 'Circuit',
        type: 'circuit',
        rounds: 2,
        blocks: [
          {
            id: 'plank',
            exerciseId: 'Plank',
            sets: [{ type: 'duration', seconds: 30 }],
            restSeconds: 0,
          },
        ],
      },
    ],
  };
}

describe('buildSteps', () => {
  const steps = buildSteps(session(), timers);

  it('flattens standard blocks and expands circuit rounds', () => {
    // 1 warm-up + 2 bench + (1 plank x 2 rounds) = 5
    expect(steps).toHaveLength(5);
    expect(steps.filter((s) => s.blockId === 'plank')).toHaveLength(2);
    expect(steps.map((s) => s.round).filter((r) => r === 2)).toHaveLength(1);
  });

  it('computes the set timer per WRK-5 rule', () => {
    const bench = steps.find((s) => s.blockId === 'bench')!;
    expect(bench.setTimerSeconds).toBe(40); // 10 * 3 + 10
    const plank = steps.find((s) => s.blockId === 'plank')!;
    expect(plank.setTimerSeconds).toBe(30); // duration
  });

  it('marks warm-up sets unlogged (SES-3b)', () => {
    expect(steps.find((s) => s.blockId === 'wu')!.logged).toBe(false);
    expect(plannedSetCount(steps)).toBe(4); // warm-up excluded
  });
});

describe('buildSteps superset ordering (WRK-12)', () => {
  const supersetSession: Session = {
    id: 's',
    name: 'S',
    sections: [
      {
        id: 'ss',
        name: 'Superset',
        type: 'superset',
        restBetweenExercisesSeconds: 0,
        blocks: [
          {
            id: 'A',
            exerciseId: 'A',
            sets: [
              { type: 'repRange', min: 8, max: 10, weightKg: 40 },
              { type: 'repRange', min: 8, max: 10, weightKg: 40 },
            ],
            restSeconds: 90,
          },
          {
            id: 'B',
            exerciseId: 'B',
            sets: [
              { type: 'repRange', min: 10, max: 12 },
              { type: 'repRange', min: 10, max: 12 },
            ],
            restSeconds: 90,
          },
        ],
      },
    ],
  };

  it('alternates A1, B1, A2, B2', () => {
    const steps = buildSteps(supersetSession, timers);
    expect(steps.map((s) => s.blockId)).toEqual(['A', 'B', 'A', 'B']);
  });

  it('rests 0 between exercises and the pair rest after the last block', () => {
    const steps = buildSteps(supersetSession, timers);
    expect(steps.map((s) => s.restSeconds)).toEqual([0, 90, 0, 90]);
  });
});

describe('setVolume', () => {
  it('is weight x reps for a completed weighted set', () => {
    expect(setVolume({ weightKg: 60, reps: 9, status: 'done', loggedAt: 0 })).toBe(540);
  });
  it('is zero for timed, skipped or bodyweight sets', () => {
    expect(setVolume({ seconds: 30, status: 'done', loggedAt: 0 })).toBe(0);
    expect(setVolume({ weightKg: 60, reps: 9, status: 'skipped', loggedAt: 0 })).toBe(0);
  });
});

describe('assembleWorkout (WRK-21)', () => {
  it('computes totals and volume, excluding unlogged warm-ups', () => {
    const steps = buildSteps(session(), timers);
    const logs: Record<string, LoggedSet> = {};
    for (const s of steps) {
      if (s.blockId === 'bench')
        logs[s.key] = { weightKg: 60, reps: 10, effort: 'ideal', status: 'done', loggedAt: 1 };
      if (s.blockId === 'plank') logs[s.key] = { seconds: 30, status: 'done', loggedAt: 1 };
    }
    const context: WorkoutContext = {
      programId: 'p',
      sessionId: 'sess',
      sessionName: 'Session',
      weekIndex: 1,
      isStandalone: false,
    };
    const workout = assembleWorkout(context, steps, logs, 1000, 61000);
    expect(workout.totals.setsPlanned).toBe(4);
    expect(workout.totals.setsDone).toBe(4);
    expect(workout.totals.volumeKg).toBe(1200); // 60*10 * 2 bench sets
    expect(workout.durationSec).toBe(60);
    expect(workout.blocks.map((b) => b.blockId)).toEqual(['bench', 'plank']); // no warm-up block
  });
});
