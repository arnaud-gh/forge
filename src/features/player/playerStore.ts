import { create } from 'zustand';
import type { Block, Section, Session, TimerDefaults } from '@/features/program';
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
import {
  EMPTY_CHANGES,
  type InProgressWorkout,
  type LoggedSet,
  type PlanProgression,
  type PlayerPhase,
  type SetStep,
  type WorkoutChanges,
  type WorkoutContext,
} from './types';

const HUGE_MS = Number.MAX_SAFE_INTEGER;

interface PlayerStore {
  active: boolean;
  context: WorkoutContext | null;
  steps: SetStep[];
  logs: Record<string, LoggedSet>;
  notes: Record<string, string>;
  changes: WorkoutChanges;
  currentIndex: number;
  phase: PlayerPhase;
  paused: boolean;
  startedAt: number;
  /** Index of the most recently logged set, for undo (WRK-24). */
  lastLoggedIndex: number | null;
  /** Bumped on each log so the UI can show the undo toast. */
  logSeq: number;
  sessionTimer: TimerState | null;
  setTimer: TimerState | null;
  restTimer: TimerState | null;
  prepTimer: TimerState | null;

  currentStep: () => SetStep | null;
  start: (
    session: Session,
    context: WorkoutContext,
    timers: TimerDefaults,
    plan?: PlanProgression,
  ) => void;
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
  goToStepIndex: (index: number) => void;

  // Session-list actions (WRK-13/15/17).
  skipSection: (sectionId: string) => void;
  swapBlock: (blockId: string, exerciseId: string) => void;
  setBlockNote: (blockId: string, note: string) => void;
  removeBlock: (blockId: string) => void;
  /** Append a block to a section for this workout (WRK-16). */
  addBlock: (sectionId: string, block: Block, timers: TimerDefaults) => void;
  /** Add or remove sets for a block in this workout (WRK-14 edit sets). */
  editSetCount: (blockId: string, count: number) => void;
  undoLastSet: () => void;

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
      notes: s.notes,
      changes: s.changes,
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
    notes: {},
    changes: EMPTY_CHANGES,
    currentIndex: 0,
    phase: 'set',
    paused: false,
    startedAt: 0,
    lastLoggedIndex: null,
    logSeq: 0,
    sessionTimer: null,
    setTimer: null,
    restTimer: null,
    prepTimer: null,

    currentStep: () => {
      const { steps, currentIndex } = get();
      return steps[currentIndex] ?? null;
    },

    start: (session, context, timers, plan) => {
      const now = Date.now();
      const steps = buildSteps(session, timers, plan);
      const first = steps[0];
      const startsWithPrep = !!first && first.prepSeconds > 0;
      set({
        active: true,
        context,
        steps,
        logs: {},
        notes: {},
        changes: EMPTY_CHANGES,
        currentIndex: 0,
        phase: startsWithPrep ? 'prep' : 'set',
        paused: false,
        startedAt: now,
        lastLoggedIndex: null,
        logSeq: 0,
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
        notes: saved.notes ?? {},
        changes: saved.changes ?? EMPTY_CHANGES,
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

      const logSeq = get().logSeq + 1;
      if (hasRest) {
        set({
          logs: nextLogs,
          lastLoggedIndex: currentIndex,
          logSeq,
          phase: 'rest',
          setTimer: null,
          restTimer: createTimer(step.restSeconds * 1000 + bonusMs, now),
        });
        persist();
      } else {
        set({ logs: nextLogs, lastLoggedIndex: currentIndex, logSeq });
        goToStep(currentIndex + 1, now);
      }
    },

    undoLastSet: () => {
      const { lastLoggedIndex, steps, logs } = get();
      if (lastLoggedIndex === null) return;
      const key = steps[lastLoggedIndex]?.key;
      const nextLogs = { ...logs };
      if (key) delete nextLogs[key];
      set({ logs: nextLogs, lastLoggedIndex: null });
      goToStep(lastLoggedIndex, Date.now()); // reopens that set, cancels the rest
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
    goToStepIndex: (index) => {
      if (index >= 0 && index < get().steps.length) goToStep(index, Date.now());
    },

    skipSection: (sectionId) => {
      const { steps, currentIndex, logs } = get();
      const nextLogs = { ...logs };
      for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i]!;
        if (step.sectionId === sectionId && !nextLogs[step.key]) {
          nextLogs[step.key] = { status: 'skipped', loggedAt: Date.now() };
        }
      }
      // Jump to the first step after the section (or summary).
      let next = currentIndex;
      while (next < steps.length && steps[next]!.sectionId === sectionId) next += 1;
      set({ logs: nextLogs });
      goToStep(next, Date.now());
    },

    swapBlock: (blockId, exerciseId) => {
      // Replace the exercise for every step of the block; clear its weight pre-fill
      // (WRK-15: planned weight cleared on swap unless the new exercise has history).
      const { steps, changes } = get();
      const original =
        changes.swaps[blockId]?.from ?? steps.find((s) => s.blockId === blockId)?.exerciseId;
      set({
        steps: steps.map((s) =>
          s.blockId === blockId
            ? { ...s, exerciseId, prefillWeightKg: null, previous: undefined }
            : s,
        ),
        changes: {
          ...changes,
          swaps: { ...changes.swaps, [blockId]: { from: original ?? exerciseId, to: exerciseId } },
        },
      });
      persist();
    },

    addBlock: (sectionId, block, timers) => {
      const { steps, currentIndex, changes } = get();
      const ref = steps.find((s) => s.sectionId === sectionId) ?? steps[steps.length - 1];
      const section: Section = {
        id: ref?.sectionId ?? sectionId,
        name: ref?.sectionName ?? '',
        type: 'standard',
        blocks: [block],
      };
      const added = buildSteps({ id: 'added', name: '', sections: [section] }, timers);
      let insertAt = steps.length;
      for (let i = steps.length - 1; i >= 0; i -= 1) {
        if (steps[i]!.sectionId === section.id) {
          insertAt = i + 1;
          break;
        }
      }
      set({
        steps: [...steps.slice(0, insertAt), ...added, ...steps.slice(insertAt)],
        currentIndex: insertAt <= currentIndex ? currentIndex + added.length : currentIndex,
        changes: {
          ...changes,
          addedBlocks: [...changes.addedBlocks, { sectionId: section.id, block }],
        },
      });
      persist();
    },

    editSetCount: (blockId, count) => {
      const { steps, logs, currentIndex, changes } = get();
      const blockSteps = steps.filter((s) => s.blockId === blockId && s.round === 1);
      const current = blockSteps.length;
      if (current === 0 || count < 1 || count === current) return;
      const currentKey = steps[currentIndex]?.key;
      let next = [...steps];
      const nextLogs = { ...logs };
      if (count > current) {
        const last = blockSteps[current - 1]!;
        const at = next.indexOf(last) + 1;
        const extra: SetStep[] = [];
        for (let i = current; i < count; i += 1) {
          const copy: SetStep = {
            ...last,
            key: `${last.sectionId}:${blockId}:1:${i}`,
            setIndex: i,
          };
          delete copy.previous;
          extra.push(copy);
        }
        next.splice(at, 0, ...extra);
      } else {
        const drop = new Set(blockSteps.slice(count).map((s) => s.key));
        next = next.filter((s) => !drop.has(s.key));
        for (const key of drop) delete nextLogs[key];
      }
      next = next.map((s) => (s.blockId === blockId ? { ...s, setCount: count } : s));
      const relocated = currentKey ? next.findIndex((s) => s.key === currentKey) : -1;
      set({
        steps: next,
        logs: nextLogs,
        currentIndex: relocated >= 0 ? relocated : Math.min(currentIndex, next.length - 1),
        changes: {
          ...changes,
          setCounts: {
            ...changes.setCounts,
            [blockId]: { from: changes.setCounts[blockId]?.from ?? current, to: count },
          },
        },
      });
      persist();
    },

    setBlockNote: (blockId, note) => {
      set({ notes: { ...get().notes, [blockId]: note } });
      persist();
    },

    removeBlock: (blockId) => {
      const { steps, currentIndex, logs, changes } = get();
      const nextLogs = { ...logs };
      for (const step of steps) {
        if (step.blockId === blockId && !nextLogs[step.key]) {
          nextLogs[step.key] = { status: 'skipped', loggedAt: Date.now() };
        }
      }
      set({
        logs: nextLogs,
        changes: { ...changes, removedBlocks: [...new Set([...changes.removedBlocks, blockId])] },
      });
      // If the current step is in the removed block, advance past it.
      if (steps[currentIndex]?.blockId === blockId) {
        let next = currentIndex;
        while (next < steps.length && steps[next]!.blockId === blockId) next += 1;
        goToStep(next, Date.now());
      } else {
        persist();
      }
    },

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
        notes: {},
        changes: EMPTY_CHANGES,
        currentIndex: 0,
        phase: 'set',
        paused: false,
        startedAt: 0,
        lastLoggedIndex: null,
        logSeq: 0,
        sessionTimer: null,
        setTimer: null,
        restTimer: null,
        prepTimer: null,
      }),
  };
});
