import { describe, expect, it } from 'vitest';
import seed from '../../../docs/program/forge-program-arms-neck-core-2026q4.json';
import {
  ImportError,
  expandSchedule,
  importProgram,
  resizeBlock,
  resolveSession,
  tryParseRange,
} from './importer';
import type { Block, Program } from './types';

function minimalProgram(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    programId: 'p1',
    name: 'Test',
    weeks: 2,
    sessions: [
      {
        id: 's1',
        name: 'S1',
        sections: [
          {
            id: 'main',
            name: 'Main',
            type: 'standard',
            blocks: [{ id: 'b1', exerciseId: 'Ex', sets: [{ type: 'reps', reps: 10 }] }],
          },
        ],
      },
    ],
    schedule: [{ week: 1, days: { mon: 's1' } }],
  };
}

describe('importProgram', () => {
  it('imports the real seed program without errors', () => {
    const program = importProgram(seed) as Program;
    expect(program.programId).toBe('arms-neck-core-spec-2026-q4');
    expect(program.weeks).toBe(10);
    expect(program.sessions).toHaveLength(6);
    expect(program.library).toHaveLength(3);
  });

  it('accepts a minimal valid program', () => {
    expect(() => importProgram(minimalProgram())).not.toThrow();
  });

  it('rejects an unsupported schema version', () => {
    const bad = { ...minimalProgram(), schemaVersion: 2 };
    expect(() => importProgram(bad)).toThrow(ImportError);
  });

  it('rejects a missing/invalid weeks count', () => {
    const bad = { ...minimalProgram(), weeks: 0 };
    expect(() => importProgram(bad)).toThrow(/weeks/);
  });

  it('rejects an invalid set type', () => {
    const bad = {
      schemaVersion: 1,
      programId: 'p',
      name: 'T',
      weeks: 1,
      sessions: [
        {
          id: 's1',
          name: 'S1',
          sections: [
            {
              id: 'm',
              name: 'M',
              type: 'standard',
              blocks: [{ id: 'b1', exerciseId: 'Ex', sets: [{ type: 'nope' }] }],
            },
          ],
        },
      ],
      schedule: [{ week: 1, days: { mon: 's1' } }],
    };
    expect(() => importProgram(bad)).toThrow(/invalid set type/i);
  });

  it('rejects a schedule referencing an unknown session', () => {
    const bad = {
      ...minimalProgram(),
      schedule: [{ week: 1, days: { mon: 'ghost' } }],
    };
    expect(() => importProgram(bad)).toThrow(/unknown session/i);
  });

  it('flags an unknown exerciseId only when a library is supplied', () => {
    const p = minimalProgram();
    expect(() => importProgram(p)).not.toThrow(); // no library: accepted
    expect(() => importProgram(p, { knownExerciseIds: new Set(['Other']) })).toThrow(
      /unknown exerciseId/i,
    );
    expect(() => importProgram(p, { knownExerciseIds: new Set(['Ex']) })).not.toThrow();
  });

  it('collects multiple issues in one error', () => {
    try {
      importProgram({ schemaVersion: 9, programId: '', name: '', weeks: -1, sessions: [] });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ImportError);
      expect((err as ImportError).issues.length).toBeGreaterThan(1);
    }
  });
});

describe('tryParseRange', () => {
  it('parses single and ranges', () => {
    expect(tryParseRange('9')).toEqual([9]);
    expect(tryParseRange('1-4')).toEqual([1, 2, 3, 4]);
    expect(tryParseRange('5-8')).toEqual([5, 6, 7, 8]);
  });
  it('rejects invalid or reversed ranges', () => {
    expect(tryParseRange('x')).toBeNull();
    expect(tryParseRange('4-1')).toBeNull();
  });
});

describe('expandSchedule (seed)', () => {
  const program = importProgram(seed) as Program;
  const map = expandSchedule(program);

  it('covers every scheduled week', () => {
    for (let w = 1; w <= 10; w += 1) expect(map.has(w)).toBe(true);
  });
  it('applies the repeat 1-4 block days', () => {
    expect(map.get(2)?.days.mon).toBe('home-pull-grip');
  });
  it('week 5-8 carries overrides, weeks 1-4 do not', () => {
    expect(map.get(3)?.overrides).toBeUndefined();
    expect(map.get(5)?.overrides).toBeDefined();
  });
  it('week 10 swaps Monday to the tests session', () => {
    expect(map.get(10)?.days.mon).toBe('tests-week-10');
  });
});

describe('resizeBlock', () => {
  const block: Block = {
    id: 'b',
    exerciseId: 'e',
    sets: [
      { type: 'repRange', min: 8, max: 10, weightKg: 60 },
      { type: 'repRange', min: 8, max: 10, weightKg: 60 },
      { type: 'repRange', min: 8, max: 10, weightKg: 60 },
    ],
  };
  it('truncates to the first N sets', () => {
    expect(resizeBlock(block, 2).sets).toHaveLength(2);
  });
  it('replicates the last set when growing', () => {
    const grown = resizeBlock(block, 5);
    expect(grown.sets).toHaveLength(5);
    expect(grown.sets[4]).toEqual(block.sets[2]);
  });
});

describe('resolveSession (seed, week 5 overrides)', () => {
  const program = importProgram(seed) as Program;
  it('applies setCount overrides for the week', () => {
    const wk5 = resolveSession(program, 'home-pull-grip', 5);
    const wk1 = resolveSession(program, 'home-pull-grip', 1);
    // home-pull-grip has a "dl" block overridden to setCount 4 from week 5 (seed).
    const findBlock = (s: typeof wk5, id: string) =>
      s?.sections.flatMap((sec) => sec.blocks).find((b) => b.id === id);
    const dl5 = findBlock(wk5, 'dl');
    const dl1 = findBlock(wk1, 'dl');
    expect(dl5).toBeDefined();
    expect(dl5!.sets.length).toBe(4);
    expect(dl1!.sets.length).toBeLessThan(4);
  });
});
