// Workout cues synthesized with the Web Audio API (WRK-23) — no bundled audio.
// The context is unlocked on the user's Start tap (iOS requirement, WRK-2).

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (Ctor) ctx = new Ctor();
    }
    void ctx?.resume();
  } catch {
    // Audio unavailable: cues are silent, everything else works.
  }
}

function tone(freq: number, durationMs: number, offset = 0, gain = 0.14): void {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(amp);
    amp.connect(ctx.destination);
    const t0 = ctx.currentTime + offset;
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);
    osc.start(t0);
    osc.stop(t0 + durationMs / 1000);
  } catch {
    // ignore
  }
}

export function cueSetEnd(): void {
  tone(660, 180);
}
export function cueRestEnd(): void {
  tone(880, 150);
  tone(1100, 160, 0.18);
}
export function cueComplete(): void {
  tone(660, 160);
  tone(880, 160, 0.16);
  tone(1320, 280, 0.32);
}
export function cueBeep(): void {
  tone(1000, 60, 0, 0.1);
}

/** Low, long gong for breathing phase transitions (BR-7/8). */
export function cueGong(): void {
  tone(196, 900, 0, 0.18);
  tone(294, 900, 0, 0.08);
}

/** Soft tick per breath (BR-6, breathing sounds). */
export function cueBreath(): void {
  tone(520, 90, 0, 0.06);
}
