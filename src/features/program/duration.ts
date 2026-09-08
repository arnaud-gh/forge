import type { Block, ProgramSet, Session } from './types';

// Estimated session duration (SES-5): sum of set timers + rests + prep times.
// This is an estimate for Home and the pre-session overview; the player uses the
// exact timer rule (WRK-5) at run time.

export interface TimerDefaults {
  secondsPerRep: number;
  setMarginSeconds: number;
  defaultRestSeconds: number;
}

/** Timer length for one set (WRK-5 rule), used for the estimate. */
export function setTimerSeconds(set: ProgramSet, block: Block, timers: TimerDefaults): number {
  switch (set.type) {
    case 'duration':
    case 'amrap':
      return set.seconds;
    case 'reps':
      return block.setTimerSeconds ?? set.reps * timers.secondsPerRep + timers.setMarginSeconds;
    case 'repRange':
      return block.setTimerSeconds ?? set.max * timers.secondsPerRep + timers.setMarginSeconds;
    case 'restPause':
      // No countdown; rough estimate for planning only.
      return set.totalReps * timers.secondsPerRep + timers.setMarginSeconds;
  }
}

export function estimateSessionSeconds(session: Session, timers: TimerDefaults): number {
  let total = 0;
  for (const section of session.sections) {
    const rounds = section.type === 'circuit' ? (section.rounds ?? 1) : 1;
    let sectionSum = 0;
    for (const block of section.blocks) {
      sectionSum += block.prepSeconds ?? 0;
      let blockSum = 0;
      for (const set of block.sets) {
        const rest = block.restSeconds ?? timers.defaultRestSeconds;
        blockSum += setTimerSeconds(set, block, timers) + rest;
      }
      sectionSum += blockSum * rounds;
    }
    if (section.type === 'circuit') {
      sectionSum += (section.restBetweenRoundsSeconds ?? 0) * Math.max(0, rounds - 1);
    }
    total += sectionSum;
  }
  return total;
}

/** Count of exercises (blocks) in a session, for the Today card meta. */
export function countExercises(session: Session): number {
  return session.sections.reduce((n, s) => n + s.blocks.length, 0);
}
