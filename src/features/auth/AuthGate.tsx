import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from './authStore';
import { SignInScreen } from './SignInScreen';

function Splash() {
  return (
    <main className="flex min-h-screen-safe items-center justify-center bg-app">
      <p className="font-display text-display-md uppercase tracking-[0.04em] text-ink-ghost">
        Forge
      </p>
    </main>
  );
}

/**
 * Guards protected routes: shows a splash while auth resolves, the sign-in
 * screen when signed out, and the app when signed in (PRD section 4).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (status === 'loading') return <Splash />;
  if (status === 'signedOut') return <SignInScreen />;
  return <>{children}</>;
}
