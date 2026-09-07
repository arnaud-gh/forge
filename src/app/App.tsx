import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthGate } from '@/features/auth';
import { ComponentsPage } from './dev/ComponentsPage';
import { PwaUpdater } from './PwaUpdater';

// Routing skeleton. The tab shell (step 7) replaces the protected index route.
// /dev/components is a hidden, unauthenticated gallery reachable only by URL.
export function App() {
  return (
    <BrowserRouter>
      <PwaUpdater />
      <Routes>
        <Route path="/dev/components" element={<ComponentsPage />} />
        <Route
          path="*"
          element={
            <AuthGate>
              <main className="flex min-h-screen-safe flex-col items-center justify-center bg-app px-gutter text-center">
                <p className="font-display text-display-lg uppercase text-accent">Forge</p>
                <p className="mt-2 font-ui text-body text-ink-muted">Signed in. Shell in step 7.</p>
              </main>
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
