import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type AuthError,
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

// Popup errors that mean "this environment can't do a popup" — fall back to a
// full-page redirect. A user-cancelled popup is not in this list (we surface it).
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/cancelled-popup-request',
]);

function isPopupFallbackError(err: unknown): boolean {
  return err instanceof Error && POPUP_FALLBACK_CODES.has((err as AuthError).code);
}

/**
 * Start Google sign-in. Uses a popup (a first-party window, reliable in Safari
 * where cross-domain redirect storage is blocked) and falls back to a full-page
 * redirect where popups are unavailable (some standalone PWAs). PRD section 4.
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (isPopupFallbackError(err)) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw err;
  }
}

/**
 * Resolve a pending redirect sign-in after the app reloads (the fallback path).
 * Returns the signed-in user, or null when there was no redirect in progress.
 */
export async function completeRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}
