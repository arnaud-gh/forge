import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TabBar, HomeIcon, BreatheIcon, HistoryIcon, SettingsIcon } from '@/components';
import type { ReactNode } from 'react';

// Tab keys map to routes. Labels come from the common namespace.
const TABS: Array<{ key: string; path: string; icon: ReactNode }> = [
  { key: 'home', path: '/', icon: <HomeIcon /> },
  { key: 'breathe', path: '/breathe', icon: <BreatheIcon /> },
  { key: 'history', path: '/history', icon: <HistoryIcon /> },
  { key: 'settings', path: '/settings', icon: <SettingsIcon /> },
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
  const { t } = useTranslation('common');
  const activeKey = activeKeyFor(location.pathname);

  const items = TABS.map(({ key, icon }) => ({ key, icon, label: t(`tabs.${key}`) }));

  return (
    <div className="flex h-[100dvh] flex-col bg-app">
      <main className="min-h-0 flex-1 overflow-y-auto pt-safe">
        <Outlet />
      </main>
      <TabBar
        items={items}
        activeKey={activeKey}
        onSelect={(key) => {
          const tab = TABS.find((t) => t.key === key);
          if (tab) navigate(tab.path);
        }}
      />
    </div>
  );
}
