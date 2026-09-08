import type { ProgressSegment } from '@/components';
import type { SetStep } from './types';

/** One progress segment per block occurrence (DESIGN.md), weighted by set count. */
export function buildSegments(steps: SetStep[], currentIndex: number): ProgressSegment[] {
  const segments: ProgressSegment[] = [];
  let i = 0;
  while (i < steps.length) {
    const start = i;
    const key = `${steps[i]!.blockId}:${steps[i]!.round}`;
    while (i < steps.length && `${steps[i]!.blockId}:${steps[i]!.round}` === key) i += 1;
    const length = i - start;
    if (currentIndex >= i) {
      segments.push({ weight: length, status: 'done' });
    } else if (currentIndex >= start) {
      segments.push({
        weight: length,
        status: 'current',
        progress: (currentIndex - start) / length,
      });
    } else {
      segments.push({ weight: length, status: 'upcoming' });
    }
  }
  return segments;
}

/** Completed-set percentage for the top bar (completed / planned). */
export function percentComplete(steps: SetStep[], logs: Record<string, unknown>): number {
  const planned = steps.filter((s) => s.logged);
  if (planned.length === 0) return 0;
  const done = planned.filter((s) => logs[s.key]).length;
  return Math.round((done / planned.length) * 100);
}
