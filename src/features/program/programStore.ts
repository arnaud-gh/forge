import { create } from 'zustand';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { importProgram } from './importer';
import { getSeedProgram } from './seed';
import { activationStartDate } from './schedule';
import type { Program, ProgramProgress, SessionOverlay } from './types';

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
  /**
   * Activate an imported program (PRG-1/PRG-7). Same programId keeps the overlay
   * and progress; a different programId archives the current one.
   */
  activateProgram: (program: Program) => Promise<void>;
  /** Reset progress (weeks + overlay) and restart this Monday (SET-5). */
  resetProgress: () => Promise<void>;
  /** Change the program start date (PRG-3, Settings). */
  setStartDate: (isoDate: string) => Promise<void>;
  /** Record a scheduled session as done for a week (PRG-4, called on save). */
  markSessionDone: (weekIndex: number, sessionId: string) => Promise<void>;
  /** Merge kept changes into the session's overlay (PRG-7, WRK-22). */
  saveOverlay: (sessionId: string, overlay: SessionOverlay) => Promise<void>;
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

  activateProgram: async (program) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const current = get();
    const sameProgram = current.program?.programId === program.programId;
    try {
      if (current.program && current.progress && !sameProgram) {
        await updateDoc(doc(programsCollection(uid), current.program.programId), {
          state: { ...current.progress, status: 'archived' },
        });
      }
      const progress: ProgramProgress =
        sameProgram && current.progress
          ? current.progress
          : {
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
      set({ status: 'error', error: err instanceof Error ? err.message : 'Failed to import' });
    }
  },

  resetProgress: async () => {
    const uid = auth.currentUser?.uid;
    const { program } = get();
    if (!uid || !program) return;
    const next: ProgramProgress = {
      startDate: activationStartDate(new Date()),
      status: 'active',
      overlay: {},
      weeks: {},
    };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  setStartDate: async (isoDate) => {
    const uid = auth.currentUser?.uid;
    const { program, progress } = get();
    if (!uid || !program || !progress) return;
    const next: ProgramProgress = { ...progress, startDate: isoDate };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  markSessionDone: async (weekIndex, sessionId) => {
    const uid = auth.currentUser?.uid;
    const { program, progress } = get();
    if (!uid || !program || !progress) return;
    const week = { ...(progress.weeks[weekIndex] ?? {}), [sessionId]: 'done' as const };
    const next: ProgramProgress = { ...progress, weeks: { ...progress.weeks, [weekIndex]: week } };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  saveOverlay: async (sessionId, overlay) => {
    const uid = auth.currentUser?.uid;
    const { program, progress } = get();
    if (!uid || !program || !progress) return;
    const prev = progress.overlay[sessionId] ?? {};
    const merged: SessionOverlay = {
      swaps: { ...(prev.swaps ?? {}), ...(overlay.swaps ?? {}) },
      removedBlocks: [
        ...new Set([...(prev.removedBlocks ?? []), ...(overlay.removedBlocks ?? [])]),
      ],
      setCounts: { ...(prev.setCounts ?? {}), ...(overlay.setCounts ?? {}) },
      addedBlocks: [...(prev.addedBlocks ?? []), ...(overlay.addedBlocks ?? [])],
    };
    const next: ProgramProgress = {
      ...progress,
      overlay: { ...progress.overlay, [sessionId]: merged },
    };
    await updateDoc(doc(programsCollection(uid), program.programId), { state: next });
    set({ progress: next });
  },

  reset: () => set({ status: 'loading', program: null, progress: null, error: null }),
}));
