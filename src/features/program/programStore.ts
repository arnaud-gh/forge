import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  /** Load the user's active program from Firestore (offline-cache first). */
  loadForUser: (uid: string) => Promise<void>;
  /** Activate the bundled seed program for a user with no active program. */
  activateSeed: (uid: string) => Promise<void>;
  /** Change the program start date (PRG-3, Settings). Realigns to that Monday. */
  setStartDate: (uid: string, isoDate: string) => Promise<void>;
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

  loadForUser: async (uid) => {
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
      const program = importProgram(data.file);
      const progress = data.state as ProgramProgress;
      set({ status: 'active', program, progress, error: null });
    } catch (err: unknown) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load program',
      });
    }
  },

  activateSeed: async (uid) => {
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

  setStartDate: async (uid, isoDate) => {
    const { program, progress } = get();
    if (!program || !progress) return;
    const next: ProgramProgress = { ...progress, startDate: isoDate };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  reset: () => set({ status: 'loading', program: null, progress: null, error: null }),
}));
