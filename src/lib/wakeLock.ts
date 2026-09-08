// Screen Wake Lock (PRD section 5, WRK-20): keep the screen on during a workout.
// Re-requested on visibilitychange since the OS drops the lock when backgrounded.

let sentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator) {
      sentinel = await navigator.wakeLock.request('screen');
    }
  } catch {
    // Denied or unsupported: acceptable, the screen may dim.
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release();
  } catch {
    // ignore
  } finally {
    sentinel = null;
  }
}

/** Re-acquire the lock when the app returns to the foreground. Returns a cleanup. */
export function keepWakeLockOnVisibility(): () => void {
  const handler = () => {
    if (document.visibilityState === 'visible' && sentinel === null) {
      void requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
