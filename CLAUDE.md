# Forge

Personal fitness PWA for iPhone. Single user in v1, multi-user-ready. Guided workout player, progressive overload logging, Wim Hof style breathing. Offline first.

## Source of truth

- Requirements: @docs/PRD.md (requirement IDs like WRK-7, PROG-2 are referenced in issues, commits and tests)
- Visual system: @docs/DESIGN.md (tokens, components, motion, layout; overrides any visual choice you would make yourself)
- Seed program: `docs/program/forge-program-arms-neck-core-2026q4.json` and its notes `docs/program/forge-program-notes.md`
- Exercise data: free-exercise-db subset generated into `src/data/exercises.json` by `scripts/build-exercises.ts`

When the PRD and DESIGN.md disagree on behaviour, the PRD wins. On visuals, DESIGN.md wins. If something is missing in both, ask before inventing; if you must decide, write the decision in `docs/DECISIONS.md` with the date.

## Stack

React 18, TypeScript (strict), Vite, Tailwind CSS, Framer Motion, Zustand, Firebase (Auth Google, Firestore with offline persistence, Hosting), vite-plugin-pwa, Howler.js, react-i18next, Recharts, Vitest, ESLint, Prettier.

No Next.js, no server code, no localStorage for app state (IndexedDB via idb-keyval or zustand persist with an IndexedDB storage). No UI kit libraries: components are built from DESIGN.md tokens.

## Commands

- `npm run dev` local dev server
- `npm run build` production build (must pass with zero TypeScript errors)
- `npm run test` Vitest, run before every commit
- `npm run lint` ESLint + Prettier check
- `npm run build:exercises` regenerate `src/data/exercises.json` from the program file
- `npm run deploy` build + `firebase deploy --only hosting`

## Project structure

```
src/
  app/            router, providers, tab layout, PWA registration
  features/
    auth/         Google sign-in, user bootstrap
    program/      importer + JSON Schema validation, schedule engine, overlay
    home/         week strip, month view, today card, resume banner
    player/       workout state machine, step sequencing, timers, screens
    progression/  recommendation rules (pure functions)
    library/      exercise data access, swap and add pickers, exercise detail
    breathing/    breathing state machine, setup, session, summary
    history/      workouts, exercise history, breathing history, calendar
    settings/
  components/     design-system primitives only (Button, Stepper, Chip, Card, GigaTimer, ProgressBar, Sheet, Dialog, Toast, TabBar)
  lib/            firebase.ts, timers.ts (timestamp based), audio.ts, wakeLock.ts, haptics.ts, i18n.ts, storage.ts
  data/           exercises.json, audio manifest
  locales/en/     all UI strings, one namespace per feature
scripts/          build-exercises.ts
docs/             PRD.md, DESIGN.md, DECISIONS.md, program/
```

One feature folder owns its state, screens and tests. Cross-feature access goes through exported hooks or pure functions, never by importing another feature's store directly.

## Non-negotiable rules

- Timers derive remaining time from timestamps (`startedAt + durationMs` vs `Date.now()`), rendered with requestAnimationFrame. Never count with setInterval. Every timer must be correct after the app was backgrounded and reopened.
- Every logged set, every breathing round, and every timer anchor is persisted to IndexedDB immediately. Reloading the app mid-session resumes at the exact step (WRK-20).
- Business rules live in pure TypeScript modules under the feature folder (`schedule.ts`, `setTimer.ts`, `progression.ts`, `sequencer.ts`, `breathingMachine.ts`, `importer.ts`) with Vitest unit tests. React components only render state and dispatch.
- All Firestore data lives under `users/{uid}`. Security rules deny everything else. Never read or write outside the signed-in user's subtree.
- All user-visible strings go through i18n (`t('player.setOf', {...})`). No hardcoded UI text in components.
- Use the design tokens (`bg-app`, `ink-muted`, `text-timer-lg`, `font-display`, `duration-phase`...). No arbitrary hex values or magic pixel sizes in components. Tabular numerals on every changing number.
- Audio is unlocked on the user's Start tap (iOS). Wake lock is requested when a player or breathing session starts and re-requested on `visibilitychange`.
- Minimum 48 px touch targets in the player and breathing screens. Primary actions in the bottom action zone.
- Never use em dashes in code comments, UI strings or docs.

## Workflow

- Work milestone by milestone as defined in PRD section 11 (M0 to M6). Do not start features from a later milestone.
- For each task: read the relevant PRD IDs, restate them in one line, implement, add or update tests, run `npm run test` and `npm run build`, then commit with a message like `feat(player): rest timer with bonus rest (WRK-7, WRK-10)`.
- Keep a checklist in `docs/PROGRESS.md`: one line per requirement ID with `[ ]` / `[x]`, updated at every commit.
- Prefer small, reviewable commits on `main` (single developer). No force pushes.
- When a requirement is ambiguous or conflicts with the device reality (iOS PWA limits), stop and ask instead of silently degrading the behaviour.
- Do not add features, screens, stats, animations or settings that are not in the PRD. If you think something is missing, propose it in `docs/DECISIONS.md` as an open question.
