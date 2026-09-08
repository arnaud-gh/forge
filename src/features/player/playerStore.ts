import { create } from 'zustand';
import type { Session, TimerDefaults } from '@/features/program';
import {
  addTime,
  createTimer,
  pause as pauseTimer,
  remainingMs,
  resume as resumeTimer,
  type TimerState,
} from '@/lib/timers';
import {
  clearInProgressWorkout,
  loadInProgressWorkout,
  saveInProgressWorkout,
} from '@/lib/storage';
import { buildSteps } from './sequencer';
import type { InProgressWorkout, LoggedSet, PlayerPhase, SetStep, WorkoutContext } from './types';

const HUGE_MS = Number.MAX_SAFE_INTEGER;

interface PlayerStore {
  active: boolean;
  context: WorkoutContext | null;
  steps: SetStep[];
  logs: Record<string, LoggedSet>;
  currentIndex: number;
  phase: PlayerPhase;
  paused: boolean;
  startedAt: number;
  sessionTimer: TimerState | null;
  setTimer: TimerState | null;
  restTimer: TimerState | null;
  prepTimer: TimerState | null;

  currentStep: () => SetStep | null;
  start: (session: Session, context: WorkoutContext, timers: TimerDefaults) => void;
  /** Resume a persisted in-progress workout on app start. Returns true if found. */
  resume: () => Promise<boolean>;

  logCurrentSet: (values: Omit<LoggedSet, 'status' | 'loggedAt'>) => void;
  advanceAfterRest: () => void;
  skipRest: () => void;
  addRest: (seconds: number) => void;
  /** Begin the set from the prep phase (or when prep elapses). */
  beginSet: () => void;
  addPrep: (seconds: number) => void;

  pauseSetTimer: () => void;
  resumeSetTimer: () => void;
  restartSetTimer: () => void;

  goPrev: () => void;
  goNext: () => void;

  pauseWorkout: () => void;
  resumeWorkout: () => void;

  finish: () => void;
  discard: () => Promise<void>;
  clear: () => void;
}

function makeSetTimer(step: SetStep | undefined, now: number): TimerState | null {
  if (!step) return null;
  // Rest-pause has no countdown: a stopwatch counts up instead (WRK-5).
  if (step.target.type === 'restPause') return createTimer(HUGE_MS, now);
  if (step.setTimerSeconds <= 0) return null;
  return createTimer(step.setTimerSeconds * 1000, now);
}

function isLast(steps: SetStep[], index: number): boolean {
  return index >= steps.length - 1;
}

export const usePlayerStore = create<PlayerStore>((set, get) => {
  // Persist the current runtime to IndexedDB (best-effort, non-blocking).
  const persist = () => {
    const s = get();
    if (!s.active || !s.context || !s.sessionTimer) return;
    const snapshot: InProgressWorkout = {
      context: s.context,
      steps: s.steps,
      logs: s.logs,
      currentIndex: s.currentIndex,
      phase: s.phase,
      paused: s.paused,
      startedAt: s.startedAt,
      sessionTimer: s.sessionTimer,
      setTimer: s.setTimer,
      restTimer: s.restTimer,
      prepTimer: s.prepTimer,
    };
    void saveInProgressWorkout(snapshot);
  };

  const goToStep = (index: number, now: number) => {
    const { steps } = get();
    if (index >= steps.length) {
      set({ phase: 'summary', setTimer: null, restTimer: null, prepTimer: null });
      persist();
      return;
    }
    const step = steps[index]!;
    if (step.prepSeconds > 0) {
      set({
        currentIndex: index,
        phase: 'prep',
        prepTimer: createTimer(step.prepSeconds * 1000, now),
        setTimer: null,
        restTimer: null,
      });
    } else {
      set({
        currentIndex: index,
        phase: 'set',
        setTimer: makeSetTimer(step, now),
        restTimer: null,
        prepTimer: null,
      });
    }
    persist();
  };

  return {
    active: false,
    context: null,
    steps: [],
    logs: {},
    currentIndex: 0,
    phase: 'set',
    paused: false,
    startedAt: 0,
    sessionTimer: null,
    setTimer: null,
    restTimer: null,
    prepTimer: null,

    currentStep: () => {
      const { steps, currentIndex } = get();
      return steps[currentIndex] ?? null;
    },

    start: (session, context, timers) => {
      const now = Date.now();
      const steps = buildSteps(session, timers);
      const first = steps[0];
      const startsWithPrep = !!first && first.prepSeconds > 0;
      set({
        active: true,
        context,
        steps,
        logs: {},
        currentIndex: 0,
        phase: startsWithPrep ? 'prep' : 'set',
        paused: false,
        startedAt: now,
        sessionTimer: createTimer(HUGE_MS, now),
        setTimer: startsWithPrep ? null : makeSetTimer(first, now),
        restTimer: null,
        prepTimer: startsWithPrep ? createTimer(first.prepSeconds * 1000, now) : null,
      });
      persist();
    },

    resume: async () => {
      const saved = await loadInProgressWorkout();
      if (!saved) return false;
      set({
        active: true,
        context: saved.context,
        steps: saved.steps,
        logs: saved.logs,
        currentIndex: saved.currentIndex,
        phase: saved.phase,
        paused: saved.paused,
        startedAt: saved.startedAt,
        sessionTimer: saved.sessionTimer,
        setTimer: saved.setTimer,
        restTimer: saved.restTimer,
        prepTimer: saved.prepTimer,
      });
      return true;
    },

    logCurrentSet: (values) => {
      const now = Date.now();
      const { steps, currentIndex, logs, setTimer } = get();
      const step = steps[currentIndex];
      if (!step) return;
      const nextLogs = {
        ...logs,
        [step.key]: { ...values, status: 'done' as const, loggedAt: now },
      };

      // Bonus rest: remaining set time carries into the following rest (WRK-7).
      const bonusMs = setTimer ? remainingMs(setTimer, now) : 0;
      const hasRest = step.restSeconds > 0 && !isLast(steps, currentIndex);

      if (hasRest) {
        set({
          logs: nextLogs,
          phase: 'rest',
          setTimer: null,
          restTimer: createTimer(step.restSeconds * 1000 + bonusMs, now),
        });
        persist();
      } else {
        set({ logs: nextLogs });
        goToStep(currentIndex + 1, now);
      }
    },

    advanceAfterRest: () => goToStep(get().currentIndex + 1, Date.now()),
    skipRest: () => goToStep(get().currentIndex + 1, Date.now()),

    addRest: (seconds) => {
      const { restTimer } = get();
      if (restTimer) set({ restTimer: addTime(restTimer, seconds * 1000) });
      persist();
    },

    beginSet: () => {
      const step = get().currentStep();
      set({ phase: 'set', setTimer: makeSetTimer(step ?? undefined, Date.now()), prepTimer: null });
      persist();
    },
    addPrep: (seconds) => {
      const { prepTimer } = get();
      if (prepTimer) set({ prepTimer: addTime(prepTimer, seconds * 1000) });
      persist();
    },

    pauseSetTimer: () => {
      const { setTimer } = get();
      if (setTimer) set({ setTimer: pauseTimer(setTimer, Date.now()) });
      persist();
    },
    resumeSetTimer: () => {
      const { setTimer } = get();
      if (setTimer) set({ setTimer: resumeTimer(setTimer, Date.now()) });
      persist();
    },
    restartSetTimer: () => {
      const step = get().currentStep();
      set({ setTimer: makeSetTimer(step ?? undefined, Date.now()) });
      persist();
    },

    goPrev: () => {
      const { currentIndex } = get();
      if (currentIndex > 0) goToStep(currentIndex - 1, Date.now());
    },
    goNext: () => goToStep(get().currentIndex + 1, Date.now()),

    pauseWorkout: () => {
      const now = Date.now();
      const { sessionTimer, setTimer, restTimer } = get();
      const { prepTimer } = get();
      set({
        paused: true,
        sessionTimer: sessionTimer ? pauseTimer(sessionTimer, now) : null,
        setTimer: setTimer ? pauseTimer(setTimer, now) : null,
        restTimer: restTimer ? pauseTimer(restTimer, now) : null,
        prepTimer: prepTimer ? pauseTimer(prepTimer, now) : null,
      });
      persist();
    },
    resumeWorkout: () => {
      const now = Date.now();
      const { sessionTimer, setTimer, restTimer, prepTimer } = get();
      set({
        paused: false,
        sessionTimer: sessionTimer ? resumeTimer(sessionTimer, now) : null,
        setTimer: setTimer ? resumeTimer(setTimer, now) : null,
        restTimer: restTimer ? resumeTimer(restTimer, now) : null,
        prepTimer: prepTimer ? resumeTimer(prepTimer, now) : null,
      });
      persist();
    },

    finish: () => {
      set({ phase: 'summary', setTimer: null, restTimer: null, prepTimer: null });
      persist();
    },

    discard: async () => {
      await clearInProgressWorkout();
      get().clear();
    },

    clear: () =>
      set({
        active: false,
        context: null,
        steps: [],
        logs: {},
        currentIndex: 0,
        phase: 'set',
        paused: false,
        startedAt: 0,
        sessionTimer: null,
        setTimer: null,
        restTimer: null,
        prepTimer: null,
      }),
  };
});
