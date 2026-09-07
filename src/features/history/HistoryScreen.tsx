import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components';

// Placeholder for M0. Workout and breathing history arrive in M4/M5.
export function HistoryScreen() {
  const { t } = useTranslation('history');
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState title={t('title')} body={t('body')} />
    </div>
  );
}
