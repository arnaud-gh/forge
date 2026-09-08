import { create } from 'zustand';
import type { BreathingConfig, BreathingPhase } from './machine';

export interface BreathingAudioPrefs {
  visualFeedback: boolean;
  haptic: boolean;
  gong: boolean;
  breathingSounds: boolean;
}

interface BreathingStore {
  phase: BreathingPhase;
  round: number; // 1-based
  config: BreathingConfig;
  audio: BreathingAudioPrefs;
  recoveryHoldSec: number;
  /** Epoch ms the current phase began (timestamp-based, background-safe). */
  phaseStartedAt: number;
  retentions: number[]; // seconds per completed round
  note: string;

  start: (config: BreathingConfig, recoveryHoldSec: number, audio: BreathingAudioPrefs) => void;
  /** Move from the breathing phase into retention (auto or double tap, BR-6). */
  toRetention: () => void;
  /** End retention, record the time, move to recovery (BR-7). */
  endRetention: (seconds: number) => void;
  /** End the recovery hold: next round, or the summary (BR-8). */
  endRecovery: () => void;
  /** Finish early: summary if any round completed, else discard (BR-9). */
  finishEarly: (currentRetentionSeconds: number | null) => void;
  editRetention: (index: number, seconds: number) => void;
  deleteRetention: (index: number) => void;
  setNote: (note: string) => void;
  reset: () => void;
}

const IDLE_CONFIG: BreathingConfig = {
  speed: 'standard',
  inhaleSec: 3,
  exhaleSec: 3,
  rounds: 3,
  breaths: 30,
};

export const useBreathingStore = create<BreathingStore>((set, get) => ({
  phase: 'idle',
  round: 1,
  config: IDLE_CONFIG,
  audio: { visualFeedback: true, haptic: true, gong: true, breathingSounds: true },
  recoveryHoldSec: 15,
  phaseStartedAt: 0,
  retentions: [],
  note: '',

  start: (config, recoveryHoldSec, audio) =>
    set({
      phase: 'breathing',
      round: 1,
      config,
      audio,
      recoveryHoldSec,
      phaseStartedAt: Date.now(),
      retentions: [],
      note: '',
    }),

  toRetention: () => {
    if (get().phase !== 'breathing') return;
    set({ phase: 'retention', phaseStartedAt: Date.now() });
  },

  endRetention: (seconds) => {
    if (get().phase !== 'retention') return;
    set((s) => ({
      phase: 'recovery',
      phaseStartedAt: Date.now(),
      retentions: [...s.retentions, Math.max(0, Math.round(seconds))],
    }));
  },

  endRecovery: () => {
    const { round, config } = get();
    if (round < config.rounds) {
      set({ phase: 'breathing', round: round + 1, phaseStartedAt: Date.now() });
    } else {
      set({ phase: 'summary' });
    }
  },

  finishEarly: (currentRetentionSeconds) => {
    const s = get();
    const retentions =
      s.phase === 'retention' && currentRetentionSeconds !== null
        ? [...s.retentions, Math.max(0, Math.round(currentRetentionSeconds))]
        : s.retentions;
    if (retentions.length === 0) {
      set({ phase: 'idle' });
    } else {
      set({ phase: 'summary', retentions });
    }
  },

  editRetention: (index, seconds) =>
    set((s) => ({
      retentions: s.retentions.map((r, i) => (i === index ? Math.max(0, Math.round(seconds)) : r)),
    })),

  deleteRetention: (index) =>
    set((s) => ({ retentions: s.retentions.filter((_, i) => i !== index) })),

  setNote: (note) => set({ note }),

  reset: () => set({ phase: 'idle', round: 1, retentions: [], note: '' }),
}));
