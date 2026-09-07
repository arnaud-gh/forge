import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TabBar, HomeIcon, BreatheIcon, HistoryIcon, SettingsIcon } from '@/components';
import type { TabItem } from '@/components';

// Tab keys map to routes. Labels are localized in step 8.
const TABS: Array<TabItem & { path: string }> = [
  { key: 'home', label: 'Home', path: '/', icon: <HomeIcon /> },
  { key: 'breathe', label: 'Breathe', path: '/breathe', icon: <BreatheIcon /> },
  { key: 'history', label: 'History', path: '/history', icon: <HistoryIcon /> },
  { key: 'settings', label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

function activeKeyFor(pathname: string): string {
  if (pathname.startsWith('/breathe')) return 'breathe';
  if (pathname.startsWith('/history')) return 'history';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
}

/**
 * The tabbed app shell: scrollable content over a fixed bottom tab bar.
 * Full-screen routes (player, breathing session) render outside this layout
 * so the tab bar is hidden there (PRD section 6).
 */
export function TabLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = activeKeyFor(location.pathname);

  return (
    <div className="flex h-[100dvh] flex-col bg-app">
      <main className="min-h-0 flex-1 overflow-y-auto pt-safe">
        <Outlet />
      </main>
      <TabBar
        items={TABS}
        activeKey={activeKey}
        onSelect={(key) => {
          const tab = TABS.find((t) => t.key === key);
          if (tab) navigate(tab.path);
        }}
      />
    </div>
  );
}
