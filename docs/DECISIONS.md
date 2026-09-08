# Decisions

## 2026-09-08 — M3 session-list scope: library-dependent actions move to M5

WRK-15 (swap "Similar" suggestions) and WRK-16 (add exercise) both pick from the
exercise library, but the library JSON is produced by the M5 build step (LIB-2).
Rather than block M3, the session list ships the actions that need no library:
per-set status, go to set (WRK-14), skip section (WRK-13), notes (WRK-17), and
swap to the block's program-defined alternatives (WRK-15 first group). The
library-backed swap suggestions, add-exercise, edit-sets and the keep-changes
overlay (WRK-22 / PRG-7) are deferred to M5 when the library lands. Acceptance
goals 1 and 2 do not depend on these. Affects WRK-14/15/16/22.

## 2026-09-08 — Google sign-in uses popup with redirect fallback

PRD section 4 and the M0 plan specified `signInWithRedirect` (popup deemed
unreliable in iOS standalone PWAs). On device, redirect failed both ways:
- authDomain on `firebaseapp.com` (different origin from the `web.app` app):
  Safari storage partitioning dropped the session, bouncing back to sign-in.
- authDomain on `web.app` (same origin): a wedged pending-redirect resolution
  hung the app on the loading splash.

Decision: sign-in now uses `signInWithPopup` (a first-party window, unaffected by
cross-site storage rules) and falls back to `signInWithRedirect` only when the
environment cannot do a popup (`auth/popup-blocked`,
`auth/operation-not-supported-in-this-environment`, `auth/cancelled-popup-request`).
authDomain stays on the default `forge-cee4c.firebaseapp.com` (its OAuth redirect
URI is guaranteed authorized). Added a 5s auth-init safety timeout so the splash
can never hang. Revisit for the installed-PWA case (custom domain or hardened
redirect) during M6 device QA. Affects PRD section 4.
