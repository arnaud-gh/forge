import {
  setTimerSeconds,
  type Block,
  type Section,
  type Session,
  type TimerDefaults,
  type ProgramSet,
  type SetType,
} from '@/features/program';
import type {
  LoggedSet,
  PlanProgression,
  SavedWorkout,
  SavedWorkoutBlock,
  SetStep,
  WorkoutContext,
} from './types';

interface StepArgs {
  section: Section;
  block: Block;
  set: ProgramSet;
  round: number;
  totalRounds: number;
  setIndex: number;
  restSeconds: number;
  blockIndex: number;
  prep: boolean;
  timers: TimerDefaults;
  plan?: PlanProgression;
}

function makeStep(a: StepArgs): SetStep {
  const prog = a.plan?.[a.block.id];
  return {
    key: `${a.section.id}:${a.block.id}:${a.round}:${a.setIndex}`,
    sectionId: a.section.id,
    sectionName: a.section.name,
    sectionType: a.section.type,
    blockId: a.block.id,
    exerciseId: a.block.exerciseId,
    assisted: a.block.assisted ?? false,
    unilateral: a.block.unilateral ?? false,
    alternatives: a.block.alternatives ?? [],
    round: a.round,
    totalRounds: a.totalRounds,
    setIndex: a.setIndex,
    setCount: a.block.sets.length,
    sectionBlockIndex: a.blockIndex,
    sectionBlockCount: a.section.blocks.length,
    prepSeconds: a.prep ? (a.block.prepSeconds ?? 0) : 0,
    target: a.set,
    restSeconds: a.restSeconds,
    setTimerSeconds: setTimerSeconds(a.set, a.block, a.timers),
    logged: a.set.logged !== false,
    prefillWeightKg: prog?.prefillWeights[a.setIndex] ?? a.set.weightKg ?? null,
    ...(prog ? { recommendation: prog.kind } : {}),
    ...(prog?.previous[a.setIndex] ? { previous: prog.previous[a.setIndex] } : {}),
  };
}

/**
 * Flatten a session into an ordered list of set steps with correct execution
 * order and rests (WRK-12): standard block-by-block; superset alternates set by
 * set (A1, B1, A2, B2) with rest-between-exercises then the pair rest; circuit
 * runs all blocks each round with rest between rounds.
 */
export function buildSteps(
  session: Session,
  timers: TimerDefaults,
  plan?: PlanProgression,
): SetStep[] {
  const steps: SetStep[] = [];
  for (const section of session.sections) {
    if (section.type === 'superset') buildSuperset(section, timers, steps, plan);
    else if (section.type === 'circuit') buildCircuit(section, timers, steps, plan);
    else buildStandard(section, timers, steps, plan);
  }
  return steps;
}

function buildStandard(
  section: Section,
  timers: TimerDefaults,
  steps: SetStep[],
  plan?: PlanProgression,
): void {
  section.blocks.forEach((block, blockIndex) => {
    block.sets.forEach((set, setIndex) => {
      steps.push(
        makeStep({
          section,
          block,
          set,
          round: 1,
          totalRounds: 1,
          setIndex,
          restSeconds: block.restSeconds ?? timers.defaultRestSeconds,
          blockIndex,
          prep: setIndex === 0,
          timers,
          plan,
        }),
      );
    });
  });
}

function buildSuperset(
  section: Section,
  timers: TimerDefaults,
  steps: SetStep[],
  plan?: PlanProgression,
): void {
  const between = section.restBetweenExercisesSeconds ?? 0;
  const maxSets = Math.max(...section.blocks.map((b) => b.sets.length));
  for (let setIndex = 0; setIndex < maxSets; setIndex += 1) {
    section.blocks.forEach((block, blockIndex) => {
      const set = block.sets[setIndex];
      if (!set) return;
      const isLastBlock = blockIndex === section.blocks.length - 1;
      const rest = isLastBlock ? (block.restSeconds ?? timers.defaultRestSeconds) : between;
      steps.push(
        makeStep({
          section,
          block,
          set,
          round: 1,
          totalRounds: 1,
          setIndex,
          restSeconds: rest,
          blockIndex,
          prep: setIndex === 0,
          timers,
          plan,
        }),
      );
    });
  }
}

function buildCircuit(
  section: Section,
  timers: TimerDefaults,
  steps: SetStep[],
  plan?: PlanProgression,
): void {
  const totalRounds = section.rounds ?? 1;
  const betweenRounds = section.restBetweenRoundsSeconds ?? 0;
  for (let round = 1; round <= totalRounds; round += 1) {
    section.blocks.forEach((block, blockIndex) => {
      const isLastBlock = blockIndex === section.blocks.length - 1;
      block.sets.forEach((set, setIndex) => {
        const isLastSet = setIndex === block.sets.length - 1;
        const endOfRound = isLastBlock && isLastSet;
        const rest = endOfRound && round < totalRounds ? betweenRounds : 0;
        steps.push(
          makeStep({
            section,
            block,
            set,
            round,
            totalRounds,
            setIndex,
            restSeconds: rest,
            blockIndex,
            prep: round === 1 && setIndex === 0,
            timers,
            plan,
          }),
        );
      });
    });
  }
}

/** Sets that count toward "planned" (unlogged warm-ups excluded, SES-3b). */
export function plannedSetCount(steps: SetStep[]): number {
  return steps.filter((s) => s.logged).length;
}

/** Volume in kg for one logged set (weight x reps; 0 for timed/bodyweight). */
export function setVolume(log: LoggedSet): number {
  if (log.status !== 'done' || log.weightKg === undefined || log.reps === undefined) return 0;
  return log.weightKg * log.reps;
}

/** Assemble the saved workout record from the runtime (WRK-21, section 9). */
export function assembleWorkout(
  context: WorkoutContext,
  steps: SetStep[],
  logs: Record<string, LoggedSet>,
  notes: Record<string, string>,
  startedAt: number,
  endedAt: number,
): SavedWorkout {
  const blocks: SavedWorkoutBlock[] = [];
  const byBlock = new Map<string, SavedWorkoutBlock>();

  let setsDone = 0;
  let volumeKg = 0;

  for (const step of steps) {
    if (!step.logged) continue;
    const log = logs[step.key];
    let block = byBlock.get(step.blockId);
    if (!block) {
      block = {
        blockId: step.blockId,
        exerciseId: step.exerciseId,
        sectionName: step.sectionName,
        sets: [],
        ...(notes[step.blockId] ? { notes: notes[step.blockId] } : {}),
      };
      byBlock.set(step.blockId, block);
      blocks.push(block);
    }
    if (log) {
      if (log.status === 'done') {
        setsDone += 1;
        volumeKg += setVolume(log);
      }
      block.sets.push({
        setIndex: step.setIndex,
        type: step.target.type as SetType,
        ...(log.weightKg !== undefined ? { weightKg: log.weightKg } : {}),
        ...(log.reps !== undefined ? { reps: log.reps } : {}),
        ...(log.seconds !== undefined ? { seconds: log.seconds } : {}),
        ...(log.effort !== undefined ? { effort: log.effort } : {}),
        status: log.status,
      });
    }
  }

  return {
    programId: context.programId,
    sessionId: context.sessionId,
    sessionName: context.sessionName,
    weekIndex: context.weekIndex,
    isStandalone: context.isStandalone,
    startedAt,
    endedAt,
    durationSec: Math.round((endedAt - startedAt) / 1000),
    blocks,
    totals: { setsDone, setsPlanned: plannedSetCount(steps), volumeKg },
  };
}
