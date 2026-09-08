// Program domain model (PRD section 8 file schema + section 7.3 rules).
// The importer (importer.ts) validates raw JSON into these types.

export type SetType = 'reps' | 'repRange' | 'amrap' | 'duration' | 'restPause';

interface SetCommon {
  /** Planned weight in kg. Omit for bodyweight. */
  weightKg?: number;
  bodyweight?: boolean;
  /** logged:false = warm-up ramp / activation drill; shown but not logged (SES-3b). */
  logged?: boolean;
}
export interface RepsSet extends SetCommon {
  type: 'reps';
  reps: number;
}
export interface RepRangeSet extends SetCommon {
  type: 'repRange';
  min: number;
  max: number;
}
export interface AmrapSet extends SetCommon {
  type: 'amrap';
  seconds: number;
}
export interface DurationSet extends SetCommon {
  type: 'duration';
  seconds: number;
}
export interface RestPauseSet extends SetCommon {
  type: 'restPause';
  totalReps: number;
}
export type ProgramSet = RepsSet | RepRangeSet | AmrapSet | DurationSet | RestPauseSet;

export interface Block {
  id: string;
  exerciseId: string;
  sets: ProgramSet[];
  restSeconds?: number;
  prepSeconds?: number;
  setTimerSeconds?: number;
  notes?: string;
  equipment?: string;
  alternatives?: string[];
  unilateral?: boolean; // SES-4
  assisted?: boolean; // SES-6
}

export type SectionType = 'standard' | 'superset' | 'circuit';

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  blocks: Block[];
  rounds?: number; // circuit
  restBetweenRoundsSeconds?: number; // circuit
  restBetweenExercisesSeconds?: number; // superset
}

export interface Session {
  id: string;
  name: string;
  sections: Section[];
}

export interface CustomExercise {
  id: string;
  name: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** setCount override resizes a block (section 8 rules). */
export interface BlockOverride {
  setCount?: number;
}
export type SessionOverrides = Record<string, BlockOverride>; // blockId -> override

export interface ScheduleEntry {
  week?: number;
  /** "n-m" range shorthand, expanded by the importer. */
  repeat?: string;
  days: Partial<Record<Weekday, string>>; // weekday -> sessionId
  overrides?: Record<string, SessionOverrides>; // sessionId -> block overrides
}

export interface Program {
  schemaVersion: number;
  programId: string;
  name: string;
  description?: string;
  weeks: number;
  exercises?: CustomExercise[];
  sessions: Session[];
  schedule: ScheduleEntry[];
  library?: Session[]; // standalone sessions (PRG-6)
}

// ---- Program state (PRD section 9, users/{uid}/programs/{programId}.state) ----

export type SessionState = 'todo' | 'done' | 'missed';
export type ProgramStatus = 'active' | 'completed' | 'archived';

/** A block added by the user, appended to a section (WRK-16/22). */
export interface AddedBlockSpec {
  sectionId: string;
  block: Block;
}

/** Kept user changes for one session (PRG-7, WRK-22). */
export interface SessionOverlay {
  swaps?: Record<string, string>; // blockId -> exerciseId
  removedBlocks?: string[];
  setCounts?: Record<string, number>;
  addedBlocks?: AddedBlockSpec[];
}

/** Kept changes per sessionId (PRG-7). */
export type ProgramOverlay = Record<string, SessionOverlay>;

export interface ProgramProgress {
  /** ISO date (yyyy-mm-dd) of the Monday the program started (PRG-3). */
  startDate: string;
  status: ProgramStatus;
  overlay: ProgramOverlay;
  /** Recorded outcomes: weekIndex -> sessionId -> state. Only 'done' is stored;
   * todo/missed are derived from the calendar by the schedule engine. */
  weeks: Record<number, Record<string, SessionState>>;
}
