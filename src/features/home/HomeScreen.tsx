import { EmptyState } from '@/components';

// Placeholder for M0. Week strip, today card and month view arrive in M1.
export function HomeScreen() {
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState title="Home" body="Your week, today's session and progress will appear here." />
    </div>
  );
}
