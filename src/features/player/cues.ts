import { cueBeep, cueComplete, cueRestEnd, cueSetEnd } from '@/lib/audio';
import { HAPTIC_COMPLETE, HAPTIC_REST_END, HAPTIC_SET_END, vibrate } from '@/lib/haptics';
import { useSettingsStore } from '@/features/settings/settingsStore';

// Sound + haptic cues, gated by the live user settings (WRK-23, SET-2).
function timers() {
  return useSettingsStore.getState().settings.timers;
}

export function setEndCue(): void {
  const t = timers();
  if (t.sounds) cueSetEnd();
  if (t.vibration) vibrate(HAPTIC_SET_END);
}
export function restEndCue(): void {
  const t = timers();
  if (t.sounds) cueRestEnd();
  if (t.vibration) vibrate(HAPTIC_REST_END);
}
export function completeCue(): void {
  const t = timers();
  if (t.sounds) cueComplete();
  if (t.vibration) vibrate(HAPTIC_COMPLETE);
}
/** Last-3-seconds rest beep (WRK-23, off by default). */
export function restCountdownBeep(): void {
  const t = timers();
  if (t.sounds && t.restCountdownBeeps) cueBeep();
}
