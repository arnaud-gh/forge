import type { ReactNode } from 'react';
import { motion, useAnimationControls, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface SwipeAction {
  key: string;
  label: string;
  tone?: 'default' | 'accent' | 'danger';
  onPress: () => void;
}

const ACTION_W = 76;

const toneClass: Record<NonNullable<SwipeAction['tone']>, string> = {
  default: 'bg-surface text-ink-secondary',
  accent: 'bg-accent/15 text-accent',
  danger: 'bg-danger/20 text-danger',
};

// iOS-style swipe-left row: drags to reveal trailing actions (notes/swap/delete).
export function SwipeRow({ actions, children }: { actions: SwipeAction[]; children: ReactNode }) {
  const controls = useAnimationControls();
  const total = actions.length * ACTION_W;

  const close = () => void controls.start({ x: 0 });
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const shouldOpen = info.offset.x < -total / 2 || info.velocity.x < -400;
    void controls.start({ x: shouldOpen ? -total : 0 });
  };

  return (
    <div className="relative overflow-hidden rounded-sm">
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => {
              a.onPress();
              close();
            }}
            style={{ width: ACTION_W }}
            className={cn(
              'flex items-center justify-center font-ui text-label-sm uppercase tracking-[0.14em]',
              toneClass[a.tone ?? 'default'],
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -total, right: 0 }}
        dragElastic={0.04}
        dragMomentum={false}
        initial={{ x: 0 }}
        animate={controls}
        onDragEnd={onDragEnd}
        style={{ backgroundColor: 'var(--bg-app)' }}
        className="relative rounded-sm border border-line"
      >
        {children}
      </motion.div>
    </div>
  );
}
