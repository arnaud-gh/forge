import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthGate } from '@/features/auth';
import { HomeScreen } from '@/features/home/HomeScreen';
import { ExtraSessionsScreen } from '@/features/home/ExtraSessionsScreen';
import { TabLayout } from './TabLayout';
import { PwaUpdater } from './PwaUpdater';
import { ProgramSync } from './ProgramSync';
import { ErrorBoundary } from './ErrorBoundary';

// Heavy or rarely-first screens are code-split so the shell + Home load fast
// (PRD NFR: first load under 2s on 4G). Chunks are precached by the service
// worker after the first visit, so offline navigation still works.
const PlayerScreen = lazy(() =>
  import('@/features/player/PlayerScreen').then((m) => ({ default: m.PlayerScreen })),
);
const PreSessionOverview = lazy(() =>
  import('@/features/player/PreSessionOverview').then((m) => ({ default: m.PreSessionOverview })),
);
const BreatheScreen = lazy(() =>
  import('@/features/breathing/BreatheScreen').then((m) => ({ default: m.BreatheScreen })),
);
const BreathingSessionScreen = lazy(() =>
  import('@/features/breathing/BreathingSessionScreen').then((m) => ({
    default: m.BreathingSessionScreen,
  })),
);
const HistoryScreen = lazy(() =>
  import('@/features/history/HistoryScreen').then((m) => ({ default: m.HistoryScreen })),
);
const WorkoutDetail = lazy(() =>
  import('@/features/history/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })),
);
const SettingsScreen = lazy(() =>
  import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const ComponentsPage = lazy(() =>
  import('./dev/ComponentsPage').then((m) => ({ default: m.ComponentsPage })),
);

function Fallback() {
  return <div className="min-h-[100dvh] bg-app" aria-busy="true" />;
}

/**
 * App routing. /dev/components is a hidden, unauthenticated gallery. Everything
 * else is behind AuthGate: the four tabs render inside TabLayout (with the tab
 * bar), while the player, pre-session overview and breathing session are
 * full-screen routes outside it (tab bar hidden), per PRD section 6.
 */
export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PwaUpdater />
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/dev/components" element={<ComponentsPage />} />
            <Route
              element={
                <AuthGate>
                  <ProgramSync />
                  <Outlet />
                </AuthGate>
              }
            >
              <Route element={<TabLayout />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/extra" element={<ExtraSessionsScreen />} />
                <Route path="/breathe" element={<BreatheScreen />} />
                <Route path="/history" element={<HistoryScreen />} />
                <Route path="/history/workout/:id" element={<WorkoutDetail />} />
                <Route path="/settings" element={<SettingsScreen />} />
              </Route>
              <Route path="/session/:sessionId" element={<PreSessionOverview />} />
              <Route path="/player" element={<PlayerScreen />} />
              <Route path="/breathe/session" element={<BreathingSessionScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
