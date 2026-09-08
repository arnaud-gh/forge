import type { Effort } from '@/components';
import type { ProgramSet, SectionType, SetType } from '@/features/program';
import type { PreviousSet, RecommendationKind } from '@/features/progression';

// One set to perform, in execution order (produced by the sequencer).
export interface SetStep {
  /** Unique across the workout: sectionId:blockId:round:setIndex. */
  key: string;
  sectionId: string;
  sectionName: string;
  sectionType: SectionType;
  blockId: string;
  exerciseId: string;
  assisted: boolean;
  unilateral: boolean;
  round: number; // 1-based (circuits), else 1
  totalRounds: number; // circuit rounds, else 1
  setIndex: number; // 0-based within the block
  setCount: number; // sets in the block
  sectionBlockIndex: number; // 0-based block position in the section (superset letter)
  sectionBlockCount: number; // blocks in the section
  prepSeconds: number; // prep before the first set of a block (WRK-11)
  target: ProgramSet;
  restSeconds: number; // rest after this set
  setTimerSeconds: number; // computed countdown length (WRK-5)
  /** false for warm-up ramp sets (SES-3b): shown, timed, but not logged. */
  logged: boolean;
  // Progression annotations (M3-5), computed when the workout starts.
  prefillWeightKg?: number | null; // PROG-1 baseline for this set index
  recommendation?: RecommendationKind; // block-level chip (PROG-2/3/4)
  previous?: PreviousSet; // last time's set at this index (WRK-4)
}

/** Per-block progression annotations attached to steps at start. */
export interface BlockProgression {
  kind: RecommendationKind;
  prefillWeights: (number | null)[];
  previous: PreviousSet[];
}
export type PlanProgression = Record<string, BlockProgression>;

// A logged set outcome.
export interface LoggedSet {
  weightKg?: number;
  bodyweight?: boolean;
  reps?: number;
  seconds?: number; // duration / amrap / rest-pause elapsed
  chunks?: number; // rest-pause: number of chunks
  effort?: Effort;
  status: 'done' | 'skipped';
  loggedAt: number;
}

// The saved workout record (subset of PRD section 9, standard sections for M2).
export interface SavedWorkoutSet {
  setIndex: number;
  type: SetType;
  weightKg?: number;
  reps?: number;
  seconds?: number;
  chunks?: number;
  effort?: Effort;
  status: 'done' | 'skipped';
}
export interface SavedWorkoutBlock {
  blockId: string;
  exerciseId: string;
  sectionName: string;
  sets: SavedWorkoutSet[];
}
export interface SavedWorkout {
  programId: string | null;
  sessionId: string;
  sessionName: string;
  weekIndex: number | null;
  isStandalone: boolean;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  blocks: SavedWorkoutBlock[];
  totals: { setsDone: number; setsPlanned: number; volumeKg: number };
  note?: string;
}

// Persisted in-progress runtime (IndexedDB, WRK-20).
export type PlayerPhase = 'prep' | 'set' | 'rest' | 'summary';

export interface WorkoutContext {
  programId: string | null;
  sessionId: string;
  sessionName: string;
  weekIndex: number | null;
  isStandalone: boolean;
}

export interface InProgressWorkout {
  context: WorkoutContext;
  steps: SetStep[];
  logs: Record<string, LoggedSet>;
  currentIndex: number;
  phase: PlayerPhase;
  paused: boolean;
  startedAt: number;
  /** Serialisable timestamp anchors (TimerState shape). */
  sessionTimer: TimerAnchor;
  setTimer: TimerAnchor | null;
  restTimer: TimerAnchor | null;
  prepTimer: TimerAnchor | null;
}

export interface TimerAnchor {
  durationMs: number;
  accumulatedMs: number;
  runningSince: number | null;
}
