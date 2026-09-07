import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

/**
 * Ensure the signed-in user's Firestore document exists (PRD section 9).
 * On first sign-in, writes profile + default settings. Idempotent: existing
 * users are left untouched so their tuned settings are never overwritten.
 */
export async function bootstrapUser(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(ref, {
    profile: {
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      createdAt: serverTimestamp(),
    },
    settings: DEFAULT_SETTINGS,
  });
}
