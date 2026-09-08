import { beforeEach, describe, expect, it } from 'vitest';
import type { Session } from '@/features/program';
import { usePlayerStore } from './playerStore';
import type { WorkoutContext } from './types';

const timers = { secondsPerRep: 3, setMarginSeconds: 10, defaultRestSeconds: 90 };

const context: WorkoutContext = {
  programId: 'p',
  sessionId: 'sess',
  sessionName: 'Session',
  weekIndex: 1,
  isStandalone: false,
};

function twoSetSession(): Session {
  return {
    id: 'sess',
    name: 'Session',
    sections: [
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
            restSeconds: 60,
          },
        ],
      },
    ],
  };
}

describe('playerStore flow', () => {
  beforeEach(() => {
    usePlayerStore.getState().clear();
  });

  it('starts on the first set with a running set timer', () => {
    usePlayerStore.getState().start(twoSetSession(), context, timers);
    const s = usePlayerStore.getState();
    expect(s.active).toBe(true);
    expect(s.phase).toBe('set');
    expect(s.currentIndex).toBe(0);
    expect(s.setTimer).not.toBeNull();
    expect(s.steps).toHaveLength(2);
  });

  it('logs a set, moves to rest, then advances to the next set', () => {
    const store = usePlayerStore.getState();
    store.start(twoSetSession(), context, timers);
    store.logCurrentSet({ weightKg: 60, reps: 9, effort: 'ideal' });

    let s = usePlayerStore.getState();
    expect(s.phase).toBe('rest');
    expect(s.restTimer).not.toBeNull();
    expect(Object.keys(s.logs)).toHaveLength(1);

    usePlayerStore.getState().advanceAfterRest();
    s = usePlayerStore.getState();
    expect(s.phase).toBe('set');
    expect(s.currentIndex).toBe(1);
  });

  it('logging the last set (no rest) goes to the summary', () => {
    const store = usePlayerStore.getState();
    store.start(twoSetSession(), context, timers);
    store.logCurrentSet({ weightKg: 60, reps: 10, effort: 'ideal' });
    usePlayerStore.getState().advanceAfterRest();
    usePlayerStore.getState().logCurrentSet({ weightKg: 60, reps: 8, effort: 'max' });

    const s = usePlayerStore.getState();
    expect(s.phase).toBe('summary');
    expect(Object.keys(s.logs)).toHaveLength(2);
  });

  it('global pause freezes and resume restores the timers', () => {
    const store = usePlayerStore.getState();
    store.start(twoSetSession(), context, timers);
    usePlayerStore.getState().pauseWorkout();
    expect(usePlayerStore.getState().paused).toBe(true);
    expect(usePlayerStore.getState().setTimer?.runningSince).toBeNull();
    usePlayerStore.getState().resumeWorkout();
    expect(usePlayerStore.getState().paused).toBe(false);
    expect(usePlayerStore.getState().setTimer?.runningSince).not.toBeNull();
  });
});
