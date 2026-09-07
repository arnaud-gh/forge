// Placeholder root. Primitives (step 3), auth (step 5), PWA (step 6) and the
// tab shell (step 7) are layered on in later M0 steps.
export function App() {
  return (
    <main className="flex min-h-screen-safe flex-col items-center justify-center bg-app px-gutter text-center">
      <p className="font-display text-display-lg uppercase text-accent">Forge</p>
      <p className="mt-2 font-ui text-body text-ink-muted">Design system ready</p>
    </main>
  );
}
