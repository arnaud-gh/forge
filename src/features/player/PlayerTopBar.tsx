import { useTranslation } from 'react-i18next';
import {
  IconButton,
  SegmentedProgressBar,
  CloseIcon,
  PauseIcon,
  ListIcon,
  formatClock,
} from '@/components';
import { usePlayerStore } from './playerStore';
import { buildSegments, percentComplete } from './progress';
import { elapsedMs } from '@/lib/timers';

type PlayerTopBarProps = {
  now: number;
  onClose: () => void;
  onOpenList: () => void;
};

export function PlayerTopBar({ now, onClose, onOpenList }: PlayerTopBarProps) {
  const { t } = useTranslation(['player', 'common']);
  const steps = usePlayerStore((s) => s.steps);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const logs = usePlayerStore((s) => s.logs);
  const sessionTimer = usePlayerStore((s) => s.sessionTimer);
  const pauseWorkout = usePlayerStore((s) => s.pauseWorkout);

  const segments = buildSegments(steps, currentIndex);
  const elapsed = sessionTimer ? Math.floor(elapsedMs(sessionTimer, now) / 1000) : 0;
  const percent = percentComplete(steps, logs);

  return (
    <div className="px-gutter pt-3">
      <div className="mb-2 flex items-center justify-between">
        <IconButton label={t('common:actions.close')} onClick={onClose} className="border-0">
          <CloseIcon />
        </IconButton>
        <div className="flex items-center gap-3 font-ui text-meta tabular-nums text-ink-muted">
          <span>{formatClock(elapsed)}</span>
          <span>{percent}%</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label={t('list.title')} onClick={onOpenList} className="border-0">
            <ListIcon />
          </IconButton>
          <IconButton label={t('player:action.pause')} onClick={pauseWorkout} className="border-0">
            <PauseIcon />
          </IconButton>
        </div>
      </div>
      <SegmentedProgressBar segments={segments} />
    </div>
  );
}
