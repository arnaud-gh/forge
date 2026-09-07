/**
 * Timestamp-based timer model (PRD section 5, WRK-5/WRK-20, NFR "Timers").
 *
 * Remaining time is always derived from wall-clock timestamps, never counted with
 * setInterval, so a timer is correct after the app is backgrounded and reopened.
 * All functions are pure and take `now` (epoch ms) so they are trivially testable;
 * the UI passes `Date.now()` and re-renders with requestAnimationFrame.
 *
 * A timer accumulates elapsed time across running segments. While running,
 * `runningSince` holds the epoch when the current segment began; while paused it
 * is null and `accumulatedMs` holds the frozen elapsed total.
 */
export interface TimerState {
  /** Total countdown duration in ms. Extend with addTime (bonus rest, +15s). */
  durationMs: number;
  /** Elapsed ms from past running segments (before the current one). */
  accumulatedMs: number;
  /** Epoch ms the current running segment started, or null when paused. */
  runningSince: number | null;
}

/** Start a timer running from `now`. */
export function createTimer(durationMs: number, now: number): TimerState {
  return { durationMs, accumulatedMs: 0, runningSince: now };
}

export function isRunning(state: TimerState): boolean {
  return state.runningSince !== null;
}

/** Total elapsed ms, derived from timestamps. Never decreases while running. */
export function elapsedMs(state: TimerState, now: number): number {
  if (state.runningSince === null) return state.accumulatedMs;
  return state.accumulatedMs + Math.max(0, now - state.runningSince);
}

/** Remaining ms for a countdown, clamped to [0, durationMs]. */
export function remainingMs(state: TimerState, now: number): number {
  return Math.max(0, state.durationMs - elapsedMs(state, now));
}

/** Whole seconds remaining, rounded up (so "1s" shows until it truly hits 0). */
export function remainingSeconds(state: TimerState, now: number): number {
  return Math.ceil(remainingMs(state, now) / 1000);
}

/** A countdown is expired once no time remains. */
export function isExpired(state: TimerState, now: number): boolean {
  return remainingMs(state, now) === 0;
}

/** Freeze the timer. Idempotent if already paused. */
export function pause(state: TimerState, now: number): TimerState {
  if (state.runningSince === null) return state;
  return {
    durationMs: state.durationMs,
    accumulatedMs: elapsedMs(state, now),
    runningSince: null,
  };
}

/** Resume a paused timer from `now`. Idempotent if already running. */
export function resume(state: TimerState, now: number): TimerState {
  if (state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

/** Reset elapsed to zero and run from `now` (restart the set). Keeps duration. */
export function restart(state: TimerState, now: number): TimerState {
  return { durationMs: state.durationMs, accumulatedMs: 0, runningSince: now };
}

/** Extend the duration (e.g. +15s on rest, or bonus rest carried from a set). */
export function addTime(state: TimerState, deltaMs: number): TimerState {
  return { ...state, durationMs: Math.max(0, state.durationMs + deltaMs) };
}
