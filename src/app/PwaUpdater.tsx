import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast } from '@/components';

/**
 * Shows an "update available" toast when a new service worker is waiting, and an
 * "offline ready" notice after the first precache. Tapping the update action
 * activates the new SW and reloads (registerType: 'prompt').
 */
export function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (needRefresh) {
    return (
      <Toast
        open
        tone="warning"
        message="A new version is available."
        actionLabel="Reload"
        onAction={() => void updateServiceWorker(true)}
        onDismiss={() => setNeedRefresh(false)}
        duration={0}
      />
    );
  }

  if (offlineReady) {
    return (
      <Toast
        open
        tone="success"
        message="Ready to work offline."
        onDismiss={() => setOfflineReady(false)}
      />
    );
  }

  return null;
}
