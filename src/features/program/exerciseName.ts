import type { Program } from './types';

/**
 * Display name for an exercise id. Custom exercises come from the program;
 * free-exercise-db ids are prettified (the exercise library lands in M5).
 */
export function exerciseName(program: Program, exerciseId: string): string {
  const custom = program.exercises?.find((e) => e.id === exerciseId);
  if (custom) return custom.name;
  return exerciseId.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
