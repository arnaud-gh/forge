import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { BreathingSpeed } from '@/features/settings/types';

// Saved breathing session record (PRD section 9, BR-12).
export interface BreathingSessionRecord {
  startedAt: number;
  speed: BreathingSpeed;
  inhaleSec: number;
  exhaleSec: number;
  rounds: number;
  breaths: number;
  retentions: number[];
  avgSec: number;
  bestSec: number;
  note?: string;
}

export async function persistBreathingSession(record: BreathingSessionRecord): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  await addDoc(collection(db, 'users', uid, 'breathingSessions'), {
    ...record,
    createdAt: Date.now(),
  });
}
