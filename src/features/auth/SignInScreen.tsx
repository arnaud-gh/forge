import { Button } from '@/components';
import { useAuthStore } from './authStore';

// Sign-in screen (PRD SET-1, section 4). One primary action, DESIGN.md styling.
// Strings are localized in step 8.
export function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);

  return (
    <main className="flex min-h-screen-safe flex-col bg-app px-gutter pb-safe pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-display-lg uppercase tracking-[0.04em] text-accent">
          Forge
        </p>
        <p className="mt-3 max-w-[260px] font-ui text-body text-ink-muted">
          Train, log and breathe. One app, offline first.
        </p>
      </div>
      <div className="pb-6">
        {error && <p className="mb-3 text-center font-ui text-meta text-danger">{error}</p>}
        <Button variant="primary" onClick={() => void signIn()}>
          Sign in with Google
        </Button>
      </div>
    </main>
  );
}
