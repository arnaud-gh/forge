import { useTranslation } from 'react-i18next';
import { Button } from '@/components';
import { useAuthStore } from './authStore';

// Sign-in screen (PRD SET-1, section 4). One primary action, DESIGN.md styling.
export function SignInScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const signIn = useAuthStore((s) => s.signIn);
  const error = useAuthStore((s) => s.error);

  return (
    <main className="flex min-h-screen-safe flex-col bg-app px-gutter pb-safe pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-display-lg uppercase tracking-[0.04em] text-accent">
          {t('common:appName')}
        </p>
        <p className="mt-3 max-w-[260px] font-ui text-body text-ink-muted">{t('tagline')}</p>
      </div>
      <div className="pb-6">
        {error && <p className="mb-3 text-center font-ui text-meta text-danger">{error}</p>}
        <Button variant="primary" onClick={() => void signIn()}>
          {t('signInWithGoogle')}
        </Button>
      </div>
    </main>
  );
}
