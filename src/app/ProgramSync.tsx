import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';
import { useProgramStore } from '@/features/program';
import { usePlayerStore } from '@/features/player';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { loadLibrary } from '@/features/library/exercises';

/**
 * App-level wiring: loads the signed-in user's active program (offline-cache
 * first) and clears it on sign-out. Lives in the app layer so the program and
 * auth features stay decoupled. Renders nothing.
 */
export function ProgramSync() {
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const load = useProgramStore((s) => s.load);
  const reset = useProgramStore((s) => s.reset);
  const resumePlayer = usePlayerStore((s) => s.resume);
  const loadSettings = useSettingsStore((s) => s.load);
  const resetSettings = useSettingsStore((s) => s.reset);

  // The exercise library is static: load it once regardless of auth.
  useEffect(() => {
    void loadLibrary();
  }, []);

  useEffect(() => {
    if (uid) {
      void load();
      void loadSettings();
      void resumePlayer(); // rehydrate an in-progress workout from IndexedDB (WRK-20)
    } else {
      reset();
      resetSettings();
    }
  }, [uid, load, reset, resumePlayer, loadSettings, resetSettings]);

  return null;
}
