import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components';
import {
  countExercises,
  estimateSessionSeconds,
  resolveSession,
  resolveToday,
  type Program,
  type ProgramProgress,
} from '@/features/program';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { findSession, minutesOf } from './homeData';

type TodayCardProps = {
  program: Program;
  progress: ProgramProgress;
  today: Date;
  onStart: (sessionId: string) => void;
};

function SessionCard({
  kicker,
  program,
  weekIndex,
  sessionId,
  onStart,
}: {
  kicker: string;
  program: Program;
  weekIndex: number;
  sessionId: string;
  onStart: (sessionId: string) => void;
}) {
  const { t } = useTranslation('home');
  const base = findSession(program, sessionId);
  const resolved = resolveSession(program, sessionId, weekIndex) ?? base;
  if (!base || !resolved) return null;

  const minutes = minutesOf(
    estimateSessionSeconds(resolved, useSettingsStore.getState().settings.timers),
  );
  const exercises = countExercises(resolved);

  return (
    <Card padding="today">
      <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
        {kicker}
      </span>
      <h2 className="mt-2 font-display text-display-lg uppercase leading-none text-ink">
        {base.name}
      </h2>
      <p className="mb-4 mt-2 font-ui text-meta text-ink-muted">
        {t('estimate', { min: minutes, count: exercises })}
      </p>
      <Button variant="primary" onClick={() => onStart(sessionId)}>
        {t('today.start')}
      </Button>
    </Card>
  );
}

export function TodayCard({ program, progress, today, onStart }: TodayCardProps) {
  const { t } = useTranslation('home');
  const info = resolveToday(program, progress, today);

  if (info.isCompleted) {
    return (
      <Card padding="today">
        <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
          {t('completed.title')}
        </span>
        <p className="mt-2 font-ui text-body text-ink-secondary">{t('completed.body')}</p>
      </Card>
    );
  }

  // Today has a scheduled, not-yet-done session.
  if (info.todaySessionId && info.todayState === 'todo') {
    return (
      <SessionCard
        kicker={t('today.kicker')}
        program={program}
        weekIndex={info.weekIndex}
        sessionId={info.todaySessionId}
        onStart={onStart}
      />
    );
  }

  // A session remains this week (rest day, or today's already done).
  if (info.pendingSessionId) {
    return (
      <SessionCard
        kicker={t('today.pendingKicker')}
        program={program}
        weekIndex={info.weekIndex}
        sessionId={info.pendingSessionId}
        onStart={onStart}
      />
    );
  }

  // Rest day with nothing pending.
  return (
    <Card padding="today">
      <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
        {info.todayState === 'done' ? t('today.doneKicker') : t('today.kicker')}
      </span>
      <h2 className="mt-2 font-display text-display-lg uppercase leading-none text-ink">
        {t('today.restTitle')}
      </h2>
      <p className="mt-2 font-ui text-meta text-ink-muted">{t('today.restBody')}</p>
    </Card>
  );
}
