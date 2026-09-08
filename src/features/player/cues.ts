import { cueComplete, cueRestEnd, cueSetEnd } from '@/lib/audio';
import { HAPTIC_COMPLETE, HAPTIC_REST_END, HAPTIC_SET_END, vibrate } from '@/lib/haptics';
import { DEFAULT_SETTINGS } from '@/features/settings/defaults';

// Sound + haptic cues, gated by settings (WRK-23). Live settings wiring is M5;
// for now these read the defaults (sounds on, vibration on, beeps off).
const { sounds, vibration } = DEFAULT_SETTINGS.timers;

export function setEndCue(): void {
  if (sounds) cueSetEnd();
  if (vibration) vibrate(HAPTIC_SET_END);
}
export function restEndCue(): void {
  if (sounds) cueRestEnd();
  if (vibration) vibrate(HAPTIC_REST_END);
}
export function completeCue(): void {
  if (sounds) cueComplete();
  if (vibration) vibrate(HAPTIC_COMPLETE);
}
