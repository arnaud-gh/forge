import type { Effort } from '@/components';
import type { ProgramSet } from '@/features/program';

// Progressive-overload rules (PRD section 7.5, PROG-1..8). Pure functions computed
// from the previous performance of a block. Assisted blocks share the same logic;
// the UI inverts the wording (PROG-8).

export interface PreviousSet {
  weightKg?: number;
  reps?: number;
  effort?: Effort;
}

export type RecommendationKind = 'increase' | 'hold' | 'below' | 'none';

export interface Progression {
  kind: RecommendationKind;
  /** Per-set pre-filled weight aligned to the current set count (PROG-1). */
  prefillWeights: (number | null)[];
  /** Convenience: the first set's baseline weight. */
  baselineWeight: number | null;
}

/** Target max reps for a rep-based set (range max, or the fixed count). */
function targetMax(set: ProgramSet): number | null {
  if (set.type === 'repRange') return set.max;
  if (set.type === 'reps') return set.reps;
  return null;
}

function targetMin(set: ProgramSet): number | null {
  if (set.type === 'repRange') return set.min;
  if (set.type === 'reps') return set.reps;
  return null;
}

export interface ProgressionInput {
  /** Representative target for the block (first set). */
  target: ProgramSet;
  currentSetCount: number;
  /** Planned weight from the program, if any. */
  plannedWeightKg?: number;
  /** Last time's logged sets for this block, in order (null = first occurrence). */
  history: PreviousSet[] | null;
}

/**
 * Compute the recommendation and per-set weight pre-fills for a block.
 * Recommendations only apply to rep-based sets with a weight (PROG-6/7).
 */
export function computeProgression(input: ProgressionInput): Progression {
  const { target, currentSetCount, plannedWeightKg, history } = input;

  let lastHistoryWeight: number | null = null;
  if (history) {
    for (let i = history.length - 1; i >= 0; i -= 1) {
      const w = history[i]?.weightKg;
      if (w !== undefined) {
        lastHistoryWeight = w;
        break;
      }
    }
  }

  // PROG-1 baseline: last weight for that set index, then last weight anywhere,
  // then the program planned weight, then empty.
  const prefillWeights: (number | null)[] = Array.from({ length: currentSetCount }, (_, i) => {
    return history?.[i]?.weightKg ?? lastHistoryWeight ?? plannedWeightKg ?? null;
  });
  const baselineWeight = prefillWeights[0] ?? null;

  const isRepBased = target.type === 'reps' || target.type === 'repRange';
  const hasWeight = plannedWeightKg !== undefined || lastHistoryWeight !== null;

  // No recommendation for first occurrence, non-rep sets, or bodyweight (PROG-6/7).
  if (!history || history.length === 0 || !isRepBased || !hasWeight) {
    return { kind: 'none', prefillWeights, baselineWeight };
  }

  const max = targetMax(target);
  const min = targetMin(target);
  const working = history.filter((s) => s.reps !== undefined);

  if (working.length === 0 || max === null || min === null) {
    return { kind: 'none', prefillWeights, baselineWeight };
  }

  const reachedMax = working.every((s) => (s.reps ?? 0) >= max);
  const anyMaxEffort = working.some((s) => s.effort === 'max');
  const anyBelowMin = working.some((s) => (s.reps ?? 0) < min);

  let kind: RecommendationKind;
  if (reachedMax && !anyMaxEffort) {
    kind = 'increase'; // PROG-2
  } else if (anyBelowMin) {
    kind = 'below'; // PROG-4
  } else {
    kind = 'hold'; // PROG-3
  }

  return { kind, prefillWeights, baselineWeight };
}
