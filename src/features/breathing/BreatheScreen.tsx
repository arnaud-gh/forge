import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components';

// Placeholder for M0. Breathing setup and session arrive in M4.
export function BreatheScreen() {
  const { t } = useTranslation('breathe');
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState title={t('title')} body={t('body')} />
    </div>
  );
}
