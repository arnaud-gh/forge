import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, formatClock } from '@/components';
import { usePlayerStore } from '@/features/player';
import { useNow } from '@/features/player/useNow';
import { elapsedMs } from '@/lib/timers';

// Resume-workout banner (HOME-6): replaces the Today card while a workout is in
// progress (persisted locally).
export function ResumeBanner() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const context = usePlayerStore((s) => s.context);
  const steps = usePlayerStore((s) => s.steps);
  const logs = usePlayerStore((s) => s.logs);
  const sessionTimer = usePlayerStore((s) => s.sessionTimer);
  const paused = usePlayerStore((s) => s.paused);
  const discard = usePlayerStore((s) => s.discard);

  const now = useNow(!paused);
  const elapsed = sessionTimer ? Math.floor(elapsedMs(sessionTimer, now) / 1000) : 0;
  const planned = steps.filter((s) => s.logged).length;
  const done = Object.values(logs).filter((l) => l.status === 'done').length;

  return (
    <Card padding="today" accent>
      <div className="flex items-baseline justify-between">
        <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
          {t('resume.inProgress')}
        </span>
        <span className="font-ui text-meta tabular-nums text-ink-muted">
          {formatClock(elapsed)}
        </span>
      </div>
      <h2 className="mt-2 font-display text-display-lg uppercase leading-none text-ink">
        {context?.sessionName}
      </h2>
      <p className="mb-4 mt-2 font-ui text-meta text-ink-muted">
        {t('resume.setsDone', { done, total: planned })}
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" size="md" block={false} onClick={() => void discard()}>
          {t('resume.discard')}
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/player')}>
          {t('resume.resume')}
        </Button>
      </div>
    </Card>
  );
}
