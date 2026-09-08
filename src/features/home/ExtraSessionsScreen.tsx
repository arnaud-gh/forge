import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, IconButton } from '@/components';
import {
  countExercises,
  estimateSessionSeconds,
  useProgramStore,
  type Session,
} from '@/features/program';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { minutesOf } from './homeData';

function BackChevron() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

// Extra (standalone) sessions from the program library (PRG-6), reached from Home.
export function ExtraSessionsScreen() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();
  const program = useProgramStore((s) => s.program);
  const library: Session[] = program?.library ?? [];

  return (
    <div className="px-gutter pb-8 pt-4">
      <header className="mb-6 flex items-center gap-2">
        <IconButton
          label={t('common:actions.close')}
          onClick={() => navigate('/')}
          className="border-0"
        >
          <BackChevron />
        </IconButton>
        <h1 className="font-display text-display-md uppercase text-ink">{t('extra.title')}</h1>
      </header>

      {library.length === 0 ? (
        <div className="py-16">
          <EmptyState title={t('extra.title')} body={t('extra.empty')} />
        </div>
      ) : (
        <ul className="space-y-3">
          {library.map((session) => {
            const minutes = minutesOf(
              estimateSessionSeconds(session, useSettingsStore.getState().settings.timers),
            );
            return (
              <li key={session.id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() =>
                    navigate(`/session/${session.id}`, { state: { standalone: true } })
                  }
                >
                  <Card padding="summary">
                    <p className="font-display text-display-xs uppercase text-ink">
                      {session.name}
                    </p>
                    <p className="mt-1 font-ui text-meta text-ink-muted">
                      {t('estimate', { min: minutes, count: countExercises(session) })}
                    </p>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
