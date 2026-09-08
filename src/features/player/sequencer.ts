import {
  setTimerSeconds,
  type Session,
  type TimerDefaults,
  type SetType,
} from '@/features/program';
import type { LoggedSet, SavedWorkout, SavedWorkoutBlock, SetStep, WorkoutContext } from './types';

/**
 * Flatten a session into an ordered list of set steps (WRK-12 groundwork).
 * M2 executes standard sections block-by-block; circuits repeat their blocks
 * `rounds` times; supersets run sequentially for now (true alternation is M3).
 */
export function buildSteps(session: Session, timers: TimerDefaults): SetStep[] {
  const steps: SetStep[] = [];
  for (const section of session.sections) {
    const totalRounds = section.type === 'circuit' ? (section.rounds ?? 1) : 1;
    for (let round = 1; round <= totalRounds; round += 1) {
      for (const block of section.blocks) {
        block.sets.forEach((set, setIndex) => {
          steps.push({
            key: `${section.id}:${block.id}:${round}:${setIndex}`,
            sectionId: section.id,
            sectionName: section.name,
            sectionType: section.type,
            blockId: block.id,
            exerciseId: block.exerciseId,
            assisted: block.assisted ?? false,
            unilateral: block.unilateral ?? false,
            round,
            totalRounds,
            setIndex,
            setCount: block.sets.length,
            target: set,
            restSeconds: block.restSeconds ?? timers.defaultRestSeconds,
            setTimerSeconds: setTimerSeconds(set, block, timers),
            logged: set.logged !== false,
          });
        });
      }
    }
  }
  return steps;
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
