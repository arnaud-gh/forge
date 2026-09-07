import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TabItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

type TabBarProps = {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
};

// DESIGN.md: 4 items, 1px border-faint top, 22px stroke icon over label-xs uppercase.
// Active accent, inactive ink-faint. No badges. Hidden inside player / breathing sessions.
export function TabBar({ items, activeKey, onSelect }: TabBarProps) {
  return (
    <nav className="z-tabbar border-t border-line-faint bg-app px-7 pb-safe pt-3">
      <ul className="flex justify-between">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onSelect(item.key)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 pb-2',
                  active ? 'text-accent' : 'text-ink-faint',
                )}
              >
                <span className="flex h-[22px] items-center justify-center">{item.icon}</span>
                <span className="font-ui text-label-xs uppercase">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
