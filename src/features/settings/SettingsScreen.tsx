import { useTranslation } from 'react-i18next';
import { Button, Card } from '@/components';
import { useAuthStore } from '@/features/auth';

// Placeholder for M0: account + sign out (SET-1). Full settings arrive in M5.
export function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div className="min-h-full px-gutter py-8">
      <h1 className="mb-6 font-display text-display-md uppercase text-ink">{t('title')}</h1>
      <Card padding="today">
        <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
          {t('account')}
        </p>
        <p className="mt-2 font-display text-display-xs uppercase text-ink">
          {user?.displayName || t('signedIn')}
        </p>
        {user?.email && <p className="font-ui text-meta text-ink-muted">{user.email}</p>}
        <div className="mt-4">
          <Button variant="ghost" size="md" block={false} onClick={() => void signOut()}>
            {t('common:actions.signOut')}
          </Button>
        </div>
      </Card>
      <p className="mt-6 font-ui text-meta text-ink-faint">{t('comingSoon')}</p>
    </div>
  );
}
