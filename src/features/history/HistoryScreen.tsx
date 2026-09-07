import { EmptyState } from '@/components';

// Placeholder for M0. Workout and breathing history arrive in M4/M5.
export function HistoryScreen() {
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState
        title="History"
        body="Completed workouts and breathing sessions will appear here."
      />
    </div>
  );
}
