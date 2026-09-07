import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Config comes from VITE_FIREBASE_* env vars (.env.local, gitignored).
// See .env.example for the required keys.
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail loudly in dev if the env file was not filled in, rather than deep inside the SDK.
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  console.error(
    `Firebase config is missing values for: ${missing.join(', ')}. ` +
      'Fill in .env.local (see .env.example) and restart the dev server.',
  );
}

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Firestore with offline persistence and multi-tab support (PRD section 5).
// Reads hit the local cache first; writes queue and sync on reconnect.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const googleProvider = new GoogleAuthProvider();

/**
 * Start Google sign-in via full-page redirect. Popup sign-in is unreliable in
 * iOS standalone PWAs, so the app uses the redirect flow (PRD section 4).
 * The result is picked up by completeRedirectSignIn() on the next load.
 */
export function signInWithGoogle(): Promise<void> {
  return signInWithRedirect(auth, googleProvider);
}

/**
 * Resolve a pending redirect sign-in after the app reloads. Returns the signed-in
 * user, or null when there was no redirect in progress.
 */
export async function completeRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}
