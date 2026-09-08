import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { SavedWorkout } from './types';

/** Persist a completed workout to Firestore (users/{uid}/workouts). */
export async function persistWorkout(workout: SavedWorkout): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await addDoc(collection(db, 'users', uid, 'workouts'), { ...workout, createdAt: Date.now() });
}
