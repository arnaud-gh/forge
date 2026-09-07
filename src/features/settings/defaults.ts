import type { UserSettings } from './types';

// Default settings applied on first sign-in (PRD SET-2, SET-4, BR-2, BR-8).
// The owner tunes these in Settings; defaults come from the first program's notes.
export const DEFAULT_SETTINGS: UserSettings = {
  timers: {
    secondsPerRep: 3,
    setMarginSeconds: 10,
    defaultRestSeconds: 90,
    defaultPrepSeconds: 30,
    restCountdownBeeps: false,
    sounds: true,
    vibration: true,
  },
  equipment: [],
  breathing: {
    presets: {
      slow: { inhaleSec: 5, exhaleSec: 5 },
      standard: { inhaleSec: 3, exhaleSec: 3 },
      fast: { inhaleSec: 2, exhaleSec: 2 },
    },
    recoveryHoldSeconds: 15,
  },
  audio: {
    backgroundMusic: false,
    breathingPhaseMusic: false,
    breathingPhaseTrack: null,
    retentionPhaseMusic: false,
    retentionPhaseTrack: null,
    breathingSounds: true,
    visualFeedback: true,
    hapticFeedback: true,
    pingGong: true,
  },
  units: 'kg',
  language: 'en',
};
