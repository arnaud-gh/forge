import type { Program, Session } from '@/features/program';

/** Find a session by id in the program's scheduled sessions or standalone library. */
export function findSession(program: Program, id: string): Session | null {
  return (
    program.sessions.find((s) => s.id === id) ?? program.library?.find((s) => s.id === id) ?? null
  );
}

/** Short uppercase label for the week strip (e.g. "Pull, Grip, Core" -> "PULL"). */
export function abbreviateSession(name: string): string {
  const first = name.split(/[\s,]+/)[0] ?? '';
  return first
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5);
}

const WEEKDAY_LETTERS: Record<string, string> = {
  mon: 'M',
  tue: 'T',
  wed: 'W',
  thu: 'T',
  fri: 'F',
  sat: 'S',
  sun: 'S',
};

export function weekdayLetter(weekday: string): string {
  return WEEKDAY_LETTERS[weekday] ?? '?';
}

/** Whole minutes, rounded, for a duration in seconds. */
export function minutesOf(seconds: number): number {
  return Math.round(seconds / 60);
}
