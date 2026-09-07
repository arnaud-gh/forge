// User settings shape (PRD section 9 data model + section 7.9 requirements).

export type WeightUnit = 'kg';

export interface TimerSettings {
  secondsPerRep: number; // SET-2, default 3
  setMarginSeconds: number; // SET-2, default 10
  defaultRestSeconds: number; // SET-2, default 90
  defaultPrepSeconds: number; // SET-2, default 30
  restCountdownBeeps: boolean; // SET-2 / WRK-23, default off
  sounds: boolean; // SET-2, default on
  vibration: boolean; // SET-2, default on
}

export type BreathingSpeed = 'slow' | 'standard' | 'fast';

export interface BreathingPreset {
  inhaleSec: number;
  exhaleSec: number;
}

export interface BreathingSettings {
  presets: Record<BreathingSpeed, BreathingPreset>; // BR-2, editable in Settings
  recoveryHoldSeconds: number; // BR-8, default 15
}

export interface AudioSettings {
  // BR-3 persistent audio and feedback toggles.
  backgroundMusic: boolean;
  breathingPhaseMusic: boolean;
  breathingPhaseTrack: string | null;
  retentionPhaseMusic: boolean;
  retentionPhaseTrack: string | null;
  breathingSounds: boolean;
  visualFeedback: boolean;
  hapticFeedback: boolean;
  pingGong: boolean;
}

export interface UserSettings {
  timers: TimerSettings;
  equipment: string[]; // SET-3, available equipment ids for swap suggestions
  breathing: BreathingSettings;
  audio: AudioSettings;
  units: WeightUnit; // SET-6, kg only in v1
  language: string; // SET-6, 'en' in v1
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  // createdAt is written with a Firestore server timestamp on bootstrap.
}
