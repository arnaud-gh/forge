import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components';

// Placeholder for M0. Week strip, today card and month view arrive in M1.
export function HomeScreen() {
  const { t } = useTranslation('home');
  return (
    <div className="flex min-h-full items-center justify-center py-16">
      <EmptyState title={t('title')} body={t('body')} />
    </div>
  );
}
