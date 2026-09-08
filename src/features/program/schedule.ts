import type { DayState } from '@/components';
import { expandSchedule } from './importer';
import type { Program, ProgramProgress, Weekday } from './types';
import { WEEKDAYS } from './types';

// Schedule engine (PRG-2/3/4). Pure and date-injectable: callers pass `today`
// so behaviour is deterministic and testable. All dates are local time.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight of a date (drops the time component). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday (local midnight) of the week containing `date`. */
export function mondayOf(date: Date): Date {
  const d = startOfDay(date);
  const dow = d.getDay(); // 0 = Sunday .. 6 = Saturday
  const offsetToMonday = (dow + 6) % 7; // Mon->0, Sun->6
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offsetToMonday);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** yyyy-mm-dd in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a yyyy-mm-dd string as a local midnight date. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function sameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

/** The Monday a program activated on this date should start (PRG-3). */
export function activationStartDate(activationDate: Date): string {
  return toISODate(mondayOf(activationDate));
}

/** 1-based week index for a date (1 = the start week). May be <1 or > weeks. */
export function weekIndexForDate(startDateISO: string, date: Date): number {
  const start = parseISODate(startDateISO); // a Monday
  const weekMonday = mondayOf(date);
  const diffDays = Math.round((weekMonday.getTime() - start.getTime()) / DAY_MS);
  return Math.floor(diffDays / 7) + 1;
}

/** The Monday (local midnight) that a given week index begins on. */
export function mondayOfWeek(startDateISO: string, weekIndex: number): Date {
  return addDays(parseISODate(startDateISO), (weekIndex - 1) * 7);
}

/** True once the program's last week has fully ended (PRG-5). */
export function isProgramCompleted(program: Program, startDateISO: string, today: Date): boolean {
  return weekIndexForDate(startDateISO, today) > program.weeks;
}

/**
 * State of one scheduled session in a given week (PRG-4). `done` is read from
 * recorded progress; a not-done session is `missed` once its week has fully
 * ended (Sunday 23:59 local), otherwise `todo`.
 */
export function sessionStateFor(
  progress: ProgramProgress,
  weekIndex: number,
  sessionId: string,
  today: Date,
): DayState {
  if (progress.weeks[weekIndex]?.[sessionId] === 'done') return 'done';
  const weekMonday = mondayOfWeek(progress.startDate, weekIndex);
  const weekEnd = addDays(weekMonday, 7); // local midnight after Sunday
  return startOfDay(today).getTime() >= weekEnd.getTime() ? 'missed' : 'todo';
}

export interface DayCell {
  weekday: Weekday;
  date: Date;
  /** Scheduled session for the day, or null on a rest day. */
  sessionId: string | null;
  state: DayState; // 'rest' when no session scheduled
  isToday: boolean;
}

/** The 7 day cells (Mon..Sun) for a week (HOME-1). */
export function weekDays(
  program: Program,
  progress: ProgramProgress,
  weekIndex: number,
  today: Date,
): DayCell[] {
  const expanded = expandSchedule(program).get(weekIndex);
  const monday = mondayOfWeek(progress.startDate, weekIndex);
  return WEEKDAYS.map((weekday, i) => {
    const date = addDays(monday, i);
    const sessionId = expanded?.days[weekday] ?? null;
    const state: DayState = sessionId
      ? sessionStateFor(progress, weekIndex, sessionId, today)
      : 'rest';
    return { weekday, date, sessionId, state, isToday: sameDay(date, today) };
  });
}

export interface DayInfo {
  sessionId: string | null;
  state: DayState;
  isToday: boolean;
  /** False when the date falls outside the program's weeks. */
  inProgram: boolean;
}

/** Schedule info for an arbitrary calendar date (month view, HOME-1). */
export function dayInfoForDate(
  program: Program,
  progress: ProgramProgress,
  date: Date,
  today: Date,
): DayInfo {
  const weekIndex = weekIndexForDate(progress.startDate, date);
  const isToday = sameDay(date, today);
  if (weekIndex < 1 || weekIndex > program.weeks) {
    return { sessionId: null, state: 'rest', isToday, inProgram: false };
  }
  const weekday = WEEKDAYS[(date.getDay() + 6) % 7]!;
  const sessionId = expandSchedule(program).get(weekIndex)?.days[weekday] ?? null;
  const state: DayState = sessionId
    ? sessionStateFor(progress, weekIndex, sessionId, today)
    : 'rest';
  return { sessionId, state, isToday, inProgram: true };
}

export interface TodayInfo {
  weekIndex: number;
  /** Session scheduled for today (null if today is a rest day). */
  todaySessionId: string | null;
  todayState: DayState | null;
  /** A still-todo session remaining this week (for the "pending this week" card). */
  pendingSessionId: string | null;
  isRestDay: boolean;
  isCompleted: boolean;
}

/** Resolve what Home's Today card should show (HOME-3). */
export function resolveToday(program: Program, progress: ProgramProgress, today: Date): TodayInfo {
  const weekIndex = weekIndexForDate(progress.startDate, today);
  const isCompleted = weekIndex > program.weeks;
  const cells = weekIndex >= 1 && !isCompleted ? weekDays(program, progress, weekIndex, today) : [];
  const todayCell = cells.find((c) => c.isToday) ?? null;

  const todaySessionId = todayCell?.sessionId ?? null;
  const todayState = todaySessionId ? (todayCell?.state ?? null) : null;

  // A todo session still open this week (for rest days or after today's is done).
  const pending = cells.find((c) => c.state === 'todo' && c.sessionId !== todaySessionId);

  return {
    weekIndex,
    todaySessionId,
    todayState,
    pendingSessionId: pending?.sessionId ?? null,
    isRestDay: todaySessionId === null,
    isCompleted,
  };
}
