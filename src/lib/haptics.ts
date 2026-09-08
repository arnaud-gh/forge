// Vibration cues (WRK-23). Best-effort: unsupported on most iOS Safari, no-ops there.
export function vibrate(pattern: number | number[]): void {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export const HAPTIC_SET_END = 180;
export const HAPTIC_REST_END = [120, 60, 120];
export const HAPTIC_COMPLETE = [200, 80, 200, 80, 200];
