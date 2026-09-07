import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, completeRedirectSignIn, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { bootstrapUser } from './bootstrapUser';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Last sign-in error message, if any. */
  error: string | null;
  /** Start listening to auth state. Safe to call once (guarded). */
  init: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  error: null,

  init: () => {
    if (initialized) return;
    initialized = true;

    // Surface any error from a completed redirect sign-in.
    completeRedirectSignIn().catch((err: unknown) => {
      set({ error: err instanceof Error ? err.message : 'Sign-in failed' });
    });

    onAuthStateChanged(auth, (user) => {
      if (user) {
        // Bootstrap runs against the offline-persistent cache; it never blocks the UI.
        void bootstrapUser(user).catch((err: unknown) => {
          set({ error: err instanceof Error ? err.message : 'User setup failed' });
        });
        set({ user, status: 'signedIn', error: null });
      } else {
        set({ user: null, status: 'signedOut' });
      }
    });
  },

  signIn: async () => {
    set({ error: null });
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Sign-in failed' });
    }
  },

  signOut: async () => {
    await signOutUser();
  },
}));
