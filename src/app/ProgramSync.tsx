import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth';
import { useProgramStore } from '@/features/program';

/**
 * App-level wiring: loads the signed-in user's active program (offline-cache
 * first) and clears it on sign-out. Lives in the app layer so the program and
 * auth features stay decoupled. Renders nothing.
 */
export function ProgramSync() {
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const loadForUser = useProgramStore((s) => s.loadForUser);
  const reset = useProgramStore((s) => s.reset);

  useEffect(() => {
    if (uid) void loadForUser(uid);
    else reset();
  }, [uid, loadForUser, reset]);

  return null;
}
