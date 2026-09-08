import { describe, expect, it } from 'vitest';
import type { Program, ProgramProgress, Session } from './types';
import {
  activationStartDate,
  mondayOf,
  resolveToday,
  sessionStateFor,
  weekDays,
  weekIndexForDate,
} from './schedule';
import { estimateSessionSeconds } from './duration';

// 2026-01-05 is a Monday (Jan 1 2026 is a Thursday).
const START = '2026-01-05';

function program(): Program {
  const empty = (id: string): Session => ({ id, name: id, sections: [] });
  return {
    schemaVersion: 1,
    programId: 'test',
    name: 'Test',
    weeks: 3,
    sessions: [empty('s1'), empty('s2')],
    schedule: [
      { week: 1, days: { mon: 's1', wed: 's2' } },
      { week: 2, days: { mon: 's1' } },
      { week: 3, days: { mon: 's2' } },
    ],
  };
}

function progress(overrides: Partial<ProgramProgress> = {}): ProgramProgress {
  return { startDate: START, status: 'active', overlay: {}, weeks: {}, ...overrides };
}

describe('date helpers', () => {
  it('mondayOf returns the Monday of the week', () => {
    // 2026-01-08 is a Thursday.
    expect(mondayOf(new Date(2026, 0, 8))).toEqual(new Date(2026, 0, 5));
    // A Sunday still maps back to the same week's Monday.
    expect(mondayOf(new Date(2026, 0, 11))).toEqual(new Date(2026, 0, 5));
  });

  it('activationStartDate aligns to Monday', () => {
    expect(activationStartDate(new Date(2026, 0, 8))).toBe('2026-01-05');
  });

  it('weekIndexForDate counts weeks from the start Monday', () => {
    expect(weekIndexForDate(START, new Date(2026, 0, 5))).toBe(1);
    expect(weekIndexForDate(START, new Date(2026, 0, 11))).toBe(1); // Sunday of week 1
    expect(weekIndexForDate(START, new Date(2026, 0, 12))).toBe(2);
    expect(weekIndexForDate(START, new Date(2026, 0, 19))).toBe(3);
    expect(weekIndexForDate(START, new Date(2026, 0, 4))).toBe(0); // day before start
  });
});

describe('sessionStateFor (PRG-4)', () => {
  it('is todo within the current week', () => {
    expect(sessionStateFor(progress(), 1, 's1', new Date(2026, 0, 7))).toBe('todo');
  });

  it('becomes missed once the week has ended', () => {
    // Now is in week 2; week 1 has fully ended.
    expect(sessionStateFor(progress(), 1, 's1', new Date(2026, 0, 12))).toBe('missed');
  });

  it('is done when recorded, even in a past week', () => {
    const p = progress({ weeks: { 1: { s1: 'done' } } });
    expect(sessionStateFor(p, 1, 's1', new Date(2026, 0, 20))).toBe('done');
  });

  it('stays todo through Sunday 23:59 and flips Monday', () => {
    expect(sessionStateFor(progress(), 1, 's1', new Date(2026, 0, 11))).toBe('todo'); // Sunday
    expect(sessionStateFor(progress(), 1, 's1', new Date(2026, 0, 12))).toBe('missed'); // Monday
  });
});

describe('weekDays (HOME-1)', () => {
  it('returns 7 cells with scheduled sessions and rest days', () => {
    const cells = weekDays(program(), progress(), 1, new Date(2026, 0, 5));
    expect(cells).toHaveLength(7);
    expect(cells[0]?.sessionId).toBe('s1'); // Monday
    expect(cells[0]?.state).toBe('todo');
    expect(cells[0]?.isToday).toBe(true);
    expect(cells[2]?.sessionId).toBe('s2'); // Wednesday
    expect(cells[1]?.sessionId).toBeNull(); // Tuesday rest
    expect(cells[1]?.state).toBe('rest');
  });

  it('marks a past week entirely missed when nothing was done', () => {
    const cells = weekDays(program(), progress(), 1, new Date(2026, 0, 20)); // now week 3
    expect(cells.filter((c) => c.state === 'missed')).toHaveLength(2);
  });
});

describe('resolveToday (HOME-3)', () => {
  it('surfaces today’s scheduled session', () => {
    const info = resolveToday(program(), progress(), new Date(2026, 0, 5)); // Monday week 1
    expect(info.weekIndex).toBe(1);
    expect(info.todaySessionId).toBe('s1');
    expect(info.todayState).toBe('todo');
    expect(info.isRestDay).toBe(false);
  });

  it('on a rest day surfaces a pending session for the week', () => {
    const info = resolveToday(program(), progress(), new Date(2026, 0, 6)); // Tuesday, rest
    expect(info.isRestDay).toBe(true);
    expect(info.pendingSessionId).not.toBeNull();
  });

  it('reports completion after the last week', () => {
    const info = resolveToday(program(), progress(), new Date(2026, 0, 26)); // week 4
    expect(info.isCompleted).toBe(true);
  });
});

describe('estimateSessionSeconds (SES-5)', () => {
  const timers = { secondsPerRep: 3, setMarginSeconds: 10, defaultRestSeconds: 90 };

  it('sums set timers, rests and prep for a standard block', () => {
    const session: Session = {
      id: 'x',
      name: 'X',
      sections: [
        {
          id: 'main',
          name: 'Main',
          type: 'standard',
          blocks: [
            {
              id: 'b',
              exerciseId: 'e',
              sets: [{ type: 'reps', reps: 10 }],
              restSeconds: 60,
              prepSeconds: 30,
            },
          ],
        },
      ],
    };
    // timer 10*3+10=40, rest 60, prep 30 => 130
    expect(estimateSessionSeconds(session, timers)).toBe(130);
  });

  it('multiplies circuit blocks by rounds and adds between-round rest', () => {
    const session: Session = {
      id: 'x',
      name: 'X',
      sections: [
        {
          id: 'c',
          name: 'Circuit',
          type: 'circuit',
          rounds: 2,
          restBetweenRoundsSeconds: 15,
          blocks: [
            { id: 'b', exerciseId: 'e', sets: [{ type: 'duration', seconds: 30 }], restSeconds: 0 },
          ],
        },
      ],
    };
    // (30+0) * 2 rounds + 15 * (2-1) = 75
    expect(estimateSessionSeconds(session, timers)).toBe(75);
  });
});
