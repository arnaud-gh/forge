import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ComponentsPage } from './dev/ComponentsPage';

// Routing skeleton. The tab shell (step 7) replaces the index route; auth (step 5)
// wraps protected routes. /dev/components is a hidden gallery, reachable only by URL.
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dev/components" element={<ComponentsPage />} />
        <Route
          path="*"
          element={
            <main className="flex min-h-screen-safe flex-col items-center justify-center bg-app px-gutter text-center">
              <p className="font-display text-display-lg uppercase text-accent">Forge</p>
              <p className="mt-2 font-ui text-body text-ink-muted">Design system ready</p>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
