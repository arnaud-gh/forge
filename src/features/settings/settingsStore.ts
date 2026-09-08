import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { DEFAULT_SETTINGS } from './defaults';
import type { UserSettings } from './types';

// User settings (PRD section 7.9), stored on users/{uid}.settings. Loaded on
// sign-in (offline-cache first), merged over defaults so new keys are safe.

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

function mergeSettings(base: UserSettings, patch: DeepPartial<UserSettings>): UserSettings {
  return {
    timers: { ...base.timers, ...(patch.timers ?? {}) },
    equipment: patch.equipment ? [...(patch.equipment as string[])] : base.equipment,
    breathing: {
      presets: {
        slow: { ...base.breathing.presets.slow, ...(patch.breathing?.presets?.slow ?? {}) },
        standard: {
          ...base.breathing.presets.standard,
          ...(patch.breathing?.presets?.standard ?? {}),
        },
        fast: { ...base.breathing.presets.fast, ...(patch.breathing?.presets?.fast ?? {}) },
      },
      recoveryHoldSeconds:
        patch.breathing?.recoveryHoldSeconds ?? base.breathing.recoveryHoldSeconds,
    },
    audio: { ...base.audio, ...(patch.audio ?? {}) },
    units: patch.units ?? base.units,
    language: patch.language ?? base.language,
  };
}

interface SettingsStore {
  settings: UserSettings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: DeepPartial<UserSettings>) => Promise<void>;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const saved = (snap.data()?.settings ?? {}) as DeepPartial<UserSettings>;
      set({ settings: mergeSettings(DEFAULT_SETTINGS, saved), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  update: async (patch) => {
    const next = mergeSettings(get().settings, patch);
    set({ settings: next });
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await setDoc(doc(db, 'users', uid), { settings: next }, { merge: true });
    } catch {
      // Offline persistence queues the write; nothing else to do.
    }
  },

  reset: () => set({ settings: DEFAULT_SETTINGS, loaded: false }),
}));

/** Convenience selector for the live settings. */
export function useSettings(): UserSettings {
  return useSettingsStore((s) => s.settings);
}
