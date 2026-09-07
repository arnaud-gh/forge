import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, IconButton, CloseIcon } from '@/components';

/**
 * Full-screen breathing session modal (tab bar hidden), on the deepest bg layer.
 * Placeholder for M0; the breathing state machine arrives in M4.
 */
export function BreathingSessionScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation(['breathe', 'common']);
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-deep pt-safe">
      <div className="flex justify-end px-gutter pt-3">
        <IconButton label={t('common:actions.close')} onClick={() => navigate('/breathe')}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title={t('session.title')} body={t('session.body')} />
      </div>
    </div>
  );
}
