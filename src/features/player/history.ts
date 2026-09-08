import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { computeProgression, type PreviousSet } from '@/features/progression';
import type { Session } from '@/features/program';
import type { PlanProgression, SavedWorkout } from './types';

/** Most recent saved workout for a session id (client-side filter, no index). */
export async function getLastWorkoutForSession(sessionId: string): Promise<SavedWorkout | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'workouts'), orderBy('createdAt', 'desc'), limit(30)),
    );
    const match = snap.docs.find((d) => (d.data() as SavedWorkout).sessionId === sessionId);
    return match ? (match.data() as SavedWorkout) : null;
  } catch {
    return null;
  }
}

/** Per-block previous sets from a saved workout. */
export function blockHistory(workout: SavedWorkout | null): Record<string, PreviousSet[]> {
  const out: Record<string, PreviousSet[]> = {};
  if (!workout) return out;
  for (const block of workout.blocks) {
    out[block.blockId] = block.sets.map((s) => ({
      ...(s.weightKg !== undefined ? { weightKg: s.weightKg } : {}),
      ...(s.reps !== undefined ? { reps: s.reps } : {}),
      ...(s.effort !== undefined ? { effort: s.effort } : {}),
    }));
  }
  return out;
}

/**
 * Compute progression annotations for every block of a resolved session, from
 * the most recent workout of the same session (PROG-1..8, WRK-4).
 */
export function computePlanProgression(
  session: Session,
  lastWorkout: SavedWorkout | null,
): PlanProgression {
  const history = blockHistory(lastWorkout);
  const plan: PlanProgression = {};
  for (const section of session.sections) {
    for (const block of section.blocks) {
      const first = block.sets[0];
      if (!first) continue;
      const previous = history[block.id] ?? [];
      const result = computeProgression({
        target: first,
        currentSetCount: block.sets.length,
        ...(first.weightKg !== undefined ? { plannedWeightKg: first.weightKg } : {}),
        history: previous.length > 0 ? previous : null,
      });
      plan[block.id] = {
        kind: result.kind,
        prefillWeights: result.prefillWeights,
        previous,
      };
    }
  }
  return plan;
}
