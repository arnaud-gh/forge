// Pure helpers for GigaTimer, kept out of the component file so the component
// module has a single component export (React Fast Refresh) and the logic is
// directly unit-testable.

export type GigaVariant = 'rest' | 'set' | 'breath';

/** mm:ss, or h:mm:ss past an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

// Base size per variant, and the one-step-down size used from 5 characters (DESIGN.md clamp).
const sizeTable: Record<GigaVariant, { base: string; stepped: string }> = {
  rest: { base: 'text-timer-xl', stepped: 'text-timer-lg' },
  set: { base: 'text-timer-lg', stepped: 'text-timer-md' },
  breath: { base: 'text-timer-md', stepped: 'text-timer-md' }, // never below timer-md
};

/**
 * Resolve the type size from the formatted string length.
 * DESIGN.md: base size holds up to 4 characters ("1:30"); from 5 characters
 * ("12:30", "1:02:15") step down one size; never wrap or shrink below timer-md.
 */
export function resolveGigaSize(variant: GigaVariant, formatted: string): string {
  const { base, stepped } = sizeTable[variant];
  return formatted.length >= 5 ? stepped : base;
}
