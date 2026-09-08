import type {
  Block,
  Program,
  ProgramSet,
  Session,
  SessionOverlay,
  SessionOverrides,
  Weekday,
} from './types';
import { WEEKDAYS } from './types';

// Importer + validation (PRD PRG-1, section 8 rules). Hand-written validator that
// reports readable errors (unknown exerciseId, missing weeks, invalid set type).
// Also expands `repeat` ranges and applies setCount overrides.

export class ImportError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Program import failed:\n- ${issues.join('\n- ')}`);
    this.name = 'ImportError';
    this.issues = issues;
  }
}

const SET_TYPES = new Set(['reps', 'repRange', 'amrap', 'duration', 'restPause']);
const SECTION_TYPES = new Set(['standard', 'superset', 'circuit']);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

interface ValidateOptions {
  /** When provided, exerciseIds not in this set (nor a custom exercise) are errors. */
  knownExerciseIds?: Set<string>;
}

/**
 * Validate raw JSON into a Program, or throw ImportError with readable issues.
 */
export function importProgram(raw: unknown, options: ValidateOptions = {}): Program {
  const issues: string[] = [];
  const push = (msg: string) => issues.push(msg);

  if (!isObject(raw)) {
    throw new ImportError(['Program file is not a JSON object.']);
  }

  if (raw.schemaVersion !== 1) {
    push(`Unsupported schemaVersion ${String(raw.schemaVersion)} (expected 1).`);
  }
  if (typeof raw.programId !== 'string' || raw.programId.length === 0) {
    push('Missing programId.');
  }
  if (typeof raw.name !== 'string' || raw.name.length === 0) {
    push('Missing program name.');
  }
  if (typeof raw.weeks !== 'number' || !Number.isInteger(raw.weeks) || raw.weeks < 1) {
    push('Missing or invalid weeks (must be a positive integer).');
  }

  const sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
  if (sessions.length === 0) push('Program has no sessions.');

  // Build the set of valid exercise ids: custom exercises + optional library.
  const customIds = new Set<string>();
  if (Array.isArray(raw.exercises)) {
    for (const ex of raw.exercises) {
      if (isObject(ex) && typeof ex.id === 'string') customIds.add(ex.id);
    }
  }
  const knownExerciseId = (id: string): boolean => {
    if (customIds.has(id)) return true;
    if (options.knownExerciseIds) return options.knownExerciseIds.has(id);
    return true; // no library provided: accept (validated later, LIB milestone)
  };

  const sessionIds = new Set<string>();
  const validateSession = (s: unknown, where: string) => {
    if (!isObject(s)) return push(`${where}: not an object.`);
    if (typeof s.id !== 'string') return push(`${where}: missing id.`);
    sessionIds.add(s.id);
    if (typeof s.name !== 'string') push(`Session ${s.id}: missing name.`);
    const sections = Array.isArray(s.sections) ? s.sections : [];
    for (const sec of sections) validateSection(sec, `Session ${s.id}`);
  };

  const validateSection = (sec: unknown, where: string) => {
    if (!isObject(sec)) return push(`${where}: a section is not an object.`);
    if (typeof sec.type !== 'string' || !SECTION_TYPES.has(sec.type)) {
      push(`${where} section ${String(sec.id)}: invalid type ${String(sec.type)}.`);
    }
    if (sec.type === 'circuit' && (typeof sec.rounds !== 'number' || sec.rounds < 1)) {
      push(`${where} circuit ${String(sec.id)}: missing rounds.`);
    }
    const blocks = Array.isArray(sec.blocks) ? sec.blocks : [];
    if (blocks.length === 0) push(`${where} section ${String(sec.id)}: no blocks.`);
    for (const b of blocks) validateBlock(b, `${where} section ${String(sec.id)}`);
  };

  const validateBlock = (b: unknown, where: string) => {
    if (!isObject(b)) return push(`${where}: a block is not an object.`);
    if (typeof b.exerciseId !== 'string') {
      push(`${where} block ${String(b.id)}: missing exerciseId.`);
    } else if (!knownExerciseId(b.exerciseId)) {
      push(`${where} block ${String(b.id)}: unknown exerciseId "${b.exerciseId}".`);
    }
    const sets = Array.isArray(b.sets) ? b.sets : [];
    if (sets.length === 0) push(`${where} block ${String(b.id)}: no sets.`);
    for (const st of sets) {
      if (!isObject(st) || typeof st.type !== 'string' || !SET_TYPES.has(st.type)) {
        push(
          `${where} block ${String(b.id)}: invalid set type ${String((st as { type?: unknown })?.type)}.`,
        );
      }
    }
  };

  for (const s of sessions) validateSession(s, 'Session');
  if (Array.isArray(raw.library)) {
    for (const s of raw.library) validateSession(s, 'Library session');
  }

  // Schedule.
  const schedule = Array.isArray(raw.schedule) ? raw.schedule : [];
  const weeks = typeof raw.weeks === 'number' ? raw.weeks : 0;
  for (const entry of schedule) {
    if (!isObject(entry)) {
      push('A schedule entry is not an object.');
      continue;
    }
    if (entry.week === undefined && entry.repeat === undefined) {
      push('A schedule entry has neither week nor repeat.');
    }
    if (entry.repeat !== undefined) {
      const range = tryParseRange(String(entry.repeat));
      if (!range) push(`Invalid schedule repeat "${String(entry.repeat)}".`);
      else if (range.some((w) => w < 1 || w > weeks)) {
        push(`Schedule repeat "${String(entry.repeat)}" is outside weeks 1-${weeks}.`);
      }
    }
    if (typeof entry.week === 'number' && (entry.week < 1 || entry.week > weeks)) {
      push(`Schedule week ${entry.week} is outside weeks 1-${weeks}.`);
    }
    if (isObject(entry.days)) {
      for (const [day, sid] of Object.entries(entry.days)) {
        if (!WEEKDAYS.includes(day as Weekday)) push(`Schedule has invalid weekday "${day}".`);
        if (typeof sid === 'string' && !sessionIds.has(sid)) {
          push(`Schedule references unknown session "${sid}".`);
        }
      }
    }
  }

  if (issues.length > 0) throw new ImportError(issues);
  return raw as unknown as Program;
}

/** Parse "n" or "n-m" into an inclusive list of week numbers, or null if invalid. */
export function tryParseRange(spec: string): number[] | null {
  const single = /^\s*(\d+)\s*$/.exec(spec);
  if (single) return [Number(single[1])];
  const range = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(spec);
  if (!range) return null;
  const start = Number(range[1]);
  const end = Number(range[2]);
  if (end < start) return null;
  const out: number[] = [];
  for (let w = start; w <= end; w += 1) out.push(w);
  return out;
}

export interface ExpandedWeek {
  days: Partial<Record<Weekday, string>>;
  overrides?: Record<string, SessionOverrides>;
}

/**
 * Expand the schedule into weekIndex -> { days, overrides } for weeks 1..weeks.
 * `repeat` ranges are expanded; later entries win for the same week. Weeks with
 * no entry are rest weeks (empty days).
 */
export function expandSchedule(program: Program): Map<number, ExpandedWeek> {
  const map = new Map<number, ExpandedWeek>();
  for (const entry of program.schedule) {
    const targetWeeks =
      entry.week !== undefined ? [entry.week] : (tryParseRange(entry.repeat ?? '') ?? []);
    for (const w of targetWeeks) {
      map.set(w, {
        days: { ...entry.days },
        ...(entry.overrides ? { overrides: entry.overrides } : {}),
      });
    }
  }
  return map;
}

/** Resize a block's set list per section-8 rules (replicate last / truncate). */
export function resizeBlock(block: Block, setCount: number): Block {
  if (setCount <= 0 || block.sets.length === 0) return block;
  const sets: ProgramSet[] = [];
  const last = block.sets[block.sets.length - 1]!;
  for (let i = 0; i < setCount; i += 1) {
    sets.push(block.sets[i] ?? { ...last });
  }
  return { ...block, sets };
}

/**
 * Resolve a concrete session for a given week, applying that week's setCount
 * overrides and then the user's kept overlay (swaps, removes, set counts,
 * added blocks; PRG-7). Returns null if the session id is unknown.
 */
export function resolveSession(
  program: Program,
  sessionId: string,
  weekIndex: number,
  overlay?: SessionOverlay,
): Session | null {
  const base =
    program.sessions.find((s) => s.id === sessionId) ??
    program.library?.find((s) => s.id === sessionId);
  if (!base) return null;

  const weekOverrides = expandSchedule(program).get(weekIndex)?.overrides?.[sessionId];
  const removed = new Set(overlay?.removedBlocks ?? []);

  const sections = base.sections.map((section) => {
    const blocks = section.blocks
      .filter((block) => !removed.has(block.id))
      .map((block) => {
        let next = block;
        const weekCount = weekOverrides?.[block.id]?.setCount;
        if (weekCount !== undefined) next = resizeBlock(next, weekCount);
        const keptCount = overlay?.setCounts?.[block.id];
        if (keptCount !== undefined) next = resizeBlock(next, keptCount);
        const swap = overlay?.swaps?.[block.id];
        if (swap) next = { ...next, exerciseId: swap };
        return next;
      });
    const added = (overlay?.addedBlocks ?? [])
      .filter((a) => a.sectionId === section.id)
      .map((a) => a.block);
    return { ...section, blocks: [...blocks, ...added] };
  });

  return { ...base, sections };
}
