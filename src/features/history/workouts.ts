import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { SavedWorkout } from '@/features/player';

export interface WorkoutRow extends SavedWorkout {
  id: string;
}

/** Recent saved workouts, newest first (offline-cache first). */
export async function fetchRecentWorkouts(max = 50): Promise<WorkoutRow[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'workouts'), orderBy('createdAt', 'desc'), limit(max)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedWorkout) }));
  } catch {
    return [];
  }
}

export async function fetchWorkout(id: string): Promise<WorkoutRow | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'workouts', id));
    return snap.exists() ? { id: snap.id, ...(snap.data() as SavedWorkout) } : null;
  } catch {
    return null;
  }
}

export interface ExerciseOccurrence {
  workoutId: string;
  date: number;
  sessionName: string;
  sets: { weightKg?: number; reps?: number; seconds?: number; effort?: string }[];
  maxWeightKg: number | null;
}

/** Past occurrences of an exercise across workouts (HIST-3), oldest first. */
export function exerciseOccurrences(
  workouts: WorkoutRow[],
  exerciseId: string,
): ExerciseOccurrence[] {
  const out: ExerciseOccurrence[] = [];
  for (const w of workouts) {
    for (const b of w.blocks) {
      if (b.exerciseId !== exerciseId) continue;
      const sets = b.sets.filter((s) => s.status === 'done');
      if (sets.length === 0) continue;
      const weights = sets.map((s) => s.weightKg).filter((x): x is number => x !== undefined);
      out.push({
        workoutId: w.id,
        date: w.endedAt,
        sessionName: w.sessionName,
        sets,
        maxWeightKg: weights.length ? Math.max(...weights) : null,
      });
    }
  }
  return out.sort((a, b) => a.date - b.date);
}
