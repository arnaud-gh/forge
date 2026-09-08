import type { ProgramSet } from '@/features/program';

/** Reps to pre-fill the reps stepper (target max, or the fixed count). */
export function targetReps(set: ProgramSet): number {
  if (set.type === 'reps') return set.reps;
  if (set.type === 'repRange') return set.max;
  return 0;
}

/** Short target string for the overview and player, e.g. "8-10", "10 reps", "30 s". */
export function formatTarget(set: ProgramSet): string {
  switch (set.type) {
    case 'reps':
      return `${set.reps} reps`;
    case 'repRange':
      return `${set.min}-${set.max}`;
    case 'duration':
      return `${set.seconds} s`;
    case 'amrap':
      return `AMRAP ${set.seconds} s`;
    case 'restPause':
      return `Rest-pause ${set.totalReps}`;
  }
}

/** Whole-set target line including sets count and weight, e.g. "3 x 8-10 @ 60 kg". */
export function formatBlockTarget(sets: ProgramSet[]): string {
  if (sets.length === 0) return '';
  const first = sets[0]!;
  const target = formatTarget(first);
  const weight =
    first.weightKg !== undefined
      ? ` @ ${first.weightKg} kg`
      : first.bodyweight
        ? ' · bodyweight'
        : '';
  return `${sets.length} x ${target}${weight}`;
}
