import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { importProgram } from './importer';
import { getSeedProgram } from './seed';
import { activationStartDate } from './schedule';
import type { Program, ProgramProgress } from './types';

export type ProgramStatus = 'loading' | 'none' | 'active' | 'error';

interface ProgramStore {
  status: ProgramStatus;
  program: Program | null;
  progress: ProgramProgress | null;
  error: string | null;
  /** Load the current user's active program from Firestore (offline-cache first). */
  load: () => Promise<void>;
  /** Activate the bundled seed program (for a user with no active program). */
  activateSeed: () => Promise<void>;
  /** Change the program start date (PRG-3, Settings). */
  setStartDate: (isoDate: string) => Promise<void>;
  reset: () => void;
}

function programsCollection(uid: string) {
  return collection(db, 'users', uid, 'programs');
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  status: 'loading',
  program: null,
  progress: null,
  error: null,

  load: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      set({ status: 'none', program: null, progress: null });
      return;
    }
    try {
      const snap = await getDocs(programsCollection(uid));
      const activeDoc = snap.docs.find(
        (d) => (d.data().state as ProgramProgress | undefined)?.status === 'active',
      );
      if (!activeDoc) {
        set({ status: 'none', program: null, progress: null, error: null });
        return;
      }
      const data = activeDoc.data();
      set({
        status: 'active',
        program: importProgram(data.file),
        progress: data.state as ProgramProgress,
        error: null,
      });
    } catch (err: unknown) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load program',
      });
    }
  },

  activateSeed: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const program = getSeedProgram();
      const progress: ProgramProgress = {
        startDate: activationStartDate(new Date()),
        status: 'active',
        overlay: {},
        weeks: {},
      };
      await setDoc(doc(programsCollection(uid), program.programId), {
        file: program,
        state: progress,
      });
      set({ status: 'active', program, progress, error: null });
    } catch (err: unknown) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to activate' });
    }
  },

  setStartDate: async (isoDate) => {
    const uid = auth.currentUser?.uid;
    const { program, progress } = get();
    if (!uid || !program || !progress) return;
    const next: ProgramProgress = { ...progress, startDate: isoDate };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  reset: () => set({ status: 'loading', program: null, progress: null, error: null }),
}));
