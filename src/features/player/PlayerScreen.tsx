import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, IconButton, CloseIcon } from '@/components';

/**
 * Full-screen player modal (tab bar hidden), PRD section 6. Placeholder for M0;
 * the workout state machine and screens arrive in M2/M3.
 */
export function PlayerScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation(['player', 'common']);
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-app pt-safe">
      <div className="flex justify-end px-gutter pt-3">
        <IconButton label={t('common:actions.close')} onClick={() => navigate('/')}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title={t('title')} body={t('body')} />
      </div>
    </div>
  );
}
