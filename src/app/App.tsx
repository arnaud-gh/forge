import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthGate } from '@/features/auth';
import { HomeScreen } from '@/features/home/HomeScreen';
import { BreatheScreen } from '@/features/breathing/BreatheScreen';
import { BreathingSessionScreen } from '@/features/breathing/BreathingSessionScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { ComponentsPage } from './dev/ComponentsPage';
import { TabLayout } from './TabLayout';
import { PwaUpdater } from './PwaUpdater';
import { ProgramSync } from './ProgramSync';

/**
 * App routing. /dev/components is a hidden, unauthenticated gallery. Everything
 * else is behind AuthGate: the four tabs render inside TabLayout (with the tab
 * bar), while the player and breathing session are full-screen routes outside it
 * (tab bar hidden), per PRD section 6.
 */
export function App() {
  return (
    <BrowserRouter>
      <PwaUpdater />
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
            <Route path="/breathe" element={<BreatheScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
          <Route path="/player" element={<PlayerScreen />} />
          <Route path="/breathe/session" element={<BreathingSessionScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
