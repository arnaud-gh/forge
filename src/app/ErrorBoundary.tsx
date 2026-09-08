import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { Button, EmptyState } from '@/components';

type Props = WithTranslation & { children: ReactNode };
type State = { error: Error | null };

// App-level error state (M6): a rendering crash shows a calm recovery screen
// instead of a blank page. In-progress workout state is already in IndexedDB.
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Forge crashed:', error, info.componentStack);
  }

  render() {
    const { t, children } = this.props;
    if (!this.state.error) return children;
    return (
      <main className="flex min-h-screen-safe items-center justify-center bg-app px-gutter">
        <EmptyState
          title={t('error.title')}
          body={t('error.body')}
          action={
            <Button
              variant="secondary"
              size="md"
              block={false}
              onClick={() => window.location.reload()}
            >
              {t('error.reload')}
            </Button>
          }
        />
      </main>
    );
  }
}

export const ErrorBoundary = withTranslation('common')(ErrorBoundaryInner);
