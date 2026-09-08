# Decisions

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
