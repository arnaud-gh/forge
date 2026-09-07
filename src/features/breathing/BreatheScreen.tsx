import { EmptyState } from '@/components';

// Placeholder for M0. Breathing setup and session arrive in M4.
export function BreatheScreen() {
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState title="Breathe" body="Guided Wim Hof style breathing sessions will live here." />
    </div>
  );
}
