import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState } from '@/components';
import { useProgramStore, weekIndexForDate, type DayState } from '@/features/program';
import { usePlayerStore } from '@/features/player';
import { WeekStrip } from './WeekStrip';
import { TodayCard } from './TodayCard';
import { DaySheet } from './DaySheet';
import { ResumeBanner } from './ResumeBanner';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type DaySelection = { date: Date; sessionId: string | null; state: DayState };

export function HomeScreen() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const status = useProgramStore((s) => s.status);
  const program = useProgramStore((s) => s.program);
  const progress = useProgramStore((s) => s.progress);
  const activateSeed = useProgramStore((s) => s.activateSeed);
  const load = useProgramStore((s) => s.load);
  const workoutActive = usePlayerStore((s) => s.active);

  const today = useMemo(() => new Date(), []);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [daySel, setDaySel] = useState<DaySelection | null>(null);

  if (status === 'loading') {
    return <div className="min-h-full" />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-full items-center justify-center py-16">
        <EmptyState
          title={t('error.title')}
          action={
            <Button variant="secondary" size="md" block={false} onClick={() => void load()}>
              {t('error.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (status === 'none' || !program || !progress) {
    return (
      <div className="flex min-h-full items-center justify-center py-16">
        <EmptyState
          title={t('none.title')}
          body={t('none.body')}
          action={
            <Button variant="primary" block={false} onClick={() => void activateSeed()}>
              {t('none.activate')}
            </Button>
          }
        />
      </div>
    );
  }

  const currentWeek = clamp(weekIndexForDate(progress.startDate, today), 1, program.weeks);
  const week = selectedWeek ?? currentWeek;

  return (
    <div className="space-y-6 px-gutter pb-8 pt-4">
      <header>
        <h1 className="font-display text-display-md uppercase leading-none text-ink">
          {program.name}
        </h1>
        <p className="mt-1 font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
          {t('weekOf', { n: currentWeek, total: program.weeks })}
        </p>
      </header>

      <WeekStrip
        program={program}
        progress={progress}
        today={today}
        selectedWeek={week}
        onWeekChange={setSelectedWeek}
        onSelectDay={(date, sessionId, state) => setDaySel({ date, sessionId, state })}
      />

      {workoutActive ? (
        <ResumeBanner />
      ) : (
        <TodayCard
          program={program}
          progress={progress}
          today={today}
          onStart={(sessionId) =>
            navigate(`/session/${sessionId}`, { state: { weekIndex: currentWeek } })
          }
        />
      )}

      <nav className="grid grid-cols-3 gap-2">
        <QuickLink label={t('quick.extra')} onClick={() => navigate('/extra')} />
        <QuickLink label={t('quick.breathe')} onClick={() => navigate('/breathe')} />
        <QuickLink label={t('quick.history')} onClick={() => navigate('/history')} />
      </nav>

      <DaySheet
        open={daySel !== null}
        onClose={() => setDaySel(null)}
        date={daySel?.date ?? null}
        sessionId={daySel?.sessionId ?? null}
        state={daySel?.state ?? null}
        program={program}
      />
    </div>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-line px-3 py-4 text-center font-ui text-label-xs uppercase tracking-[0.14em] text-ink-secondary"
    >
      {label}
    </button>
  );
}
