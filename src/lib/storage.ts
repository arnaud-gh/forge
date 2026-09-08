import { del, get, set } from 'idb-keyval';
import type { InProgressWorkout } from '@/features/player/types';

// Local-only persistence (IndexedDB) for in-progress state that must survive a
// reload or app kill (WRK-20). App data lives in Firestore; this is the runtime.

const IN_PROGRESS_WORKOUT_KEY = 'forge:inProgressWorkout';

export async function saveInProgressWorkout(data: InProgressWorkout): Promise<void> {
  try {
    await set(IN_PROGRESS_WORKOUT_KEY, data);
  } catch {
    // Best-effort: a failed persist must never crash the player.
  }
}

export async function loadInProgressWorkout(): Promise<InProgressWorkout | undefined> {
  try {
    return await get<InProgressWorkout>(IN_PROGRESS_WORKOUT_KEY);
  } catch {
    return undefined;
  }
}

export async function clearInProgressWorkout(): Promise<void> {
  try {
    await del(IN_PROGRESS_WORKOUT_KEY);
  } catch {
    // ignore
  }
}
