# Progress

One line per PRD requirement ID, grouped by PRD section. Priority in parentheses
(M = must, S = should, B = backlog). Checked when implemented, tested and building.
Update at every commit.

## M0 Foundation (milestone)

- [x] Scaffold: Vite + React 18 + TS strict, Tailwind, Framer Motion, Zustand, react-i18next, Vitest, ESLint, Prettier
- [x] Design system: DESIGN.md tokens in Tailwind + CSS vars, Anton/Archivo, safe-area helpers
- [x] Primitives (all of DESIGN.md section 2) + hidden /dev/components gallery
- [x] Firebase: auth, Firestore offline persistence, security rules, hosting config
- [x] Auth flow: Google sign-in (redirect), user bootstrap, protected routes
- [x] PWA: manifest, icons, service worker (app-shell precache), update toast
- [x] App shell: 4-tab layout + full-screen modal route pattern
- [x] i18n: react-i18next, one namespace per feature, all M0 strings externalized
- [x] Timers: lib/timers.ts (timestamp-based) + unit tests
- [x] PROGRESS.md initialized

## 7.1 Program and schedule

- [x] PRG-1 (M) One active program, imported from JSON (schema section 8)
- [x] PRG-2 (M) N weeks, sessions on fixed weekdays, week-specific overrides
- [x] PRG-3 (M) Activation start date aligned to Monday; current week index
- [x] PRG-4 (M) Session state todo/done/missed; Sunday 23:59 rollover
- [x] PRG-5 (S) Program completed state
- [x] PRG-6 (M) Standalone library sessions (never scheduled)
- [ ] PRG-7 (M) Program overlay for kept swaps/adds/removes

## 7.2 Home

- [x] HOME-1 (M) Week strip with state rings; expand to month
- [x] HOME-2 (M) Program header (name, Week X of N)
- [x] HOME-3 (M) Today card / pending / rest / done states
- [x] HOME-4 (M) Past-day sheet with that day's activity
- [x] HOME-5 (M) Quick access row (Extra sessions, Breathe, History)
- [x] HOME-6 (M) Resume-workout banner when a workout is in progress

## 7.3 Session data model

- [x] SES-1 (M) Sections: standard / superset / circuit
- [x] SES-2 (M) Block fields (sets, rest, prep, timer override, alternatives, flags)
- [x] SES-3 (M) Set target types: reps / repRange / amrap / duration / restPause
- [x] SES-3b (M) logged:false unlogged sets
- [ ] SES-3c (B) maxDuration set type
- [ ] SES-4 (S) Unilateral blocks (two halves per set)
- [x] SES-5 (M) Estimated session duration
- [x] SES-6 (M) Assisted blocks (counterweight, inverted progression)

## 7.4 Workout flow

- [x] WRK-1 (M) Pre-session overview
- [x] WRK-2 (M) Start creates in-progress record, wake lock, audio unlock, enters player
- [x] WRK-3 (M) Player top area (segmented progress, elapsed, percent, close, list)
- [x] WRK-4 (M) Current step area (labels, target, image, previous performance)
- [x] WRK-5 (M) Set timer (giant numerals + linear bar; duration rule)
- [x] WRK-6 (M) Inputs: weight, reps, effort (duration/restPause variants)
- [x] WRK-7 (M) Confirm logs set, moves to rest, bonus rest
- [x] WRK-8 (M) Timer-zero prompt, pause, restart set
- [ ] WRK-9 (M) Manual next/back navigation
- [x] WRK-10 (M) Rest screen (countdown, next preview, +15s, skip)
- [x] WRK-11 (M) Prep time countdown
- [x] WRK-12 (M) Superset and circuit execution
- [x] WRK-13 (S) Skip section
- [x] WRK-14 (M) Session list sheet + go-to-set/notes/swap (add-exercise + edit-sets: M5)
- [ ] WRK-15 (M) Swap picker
- [ ] WRK-16 (M) Add exercise
- [x] WRK-17 (M) Per-block notes
- [x] WRK-18 (M) Global pause
- [x] WRK-19 (M) Finish / discard
- [x] WRK-20 (M) Persistence + resume at exact step; wake lock re-request
- [x] WRK-21 (M) End-of-session summary
- [ ] WRK-22 (M) Keep-changes flow into overlay
- [x] WRK-23 (S) Sounds and haptics
- [x] WRK-24 (S) Undo last set

## 7.5 Progression

- [x] PROG-1 (M) Baseline weight pre-fill
- [x] PROG-2 (M) Increase recommendation
- [x] PROG-3 (M) Hold recommendation
- [x] PROG-4 (M) Below-range recommendation
- [x] PROG-5 (M) Recommendation chip; user value overrides
- [x] PROG-6 (M) amrap/duration/restPause/bodyweight show previous best
- [x] PROG-7 (M) First occurrence: no chip
- [x] PROG-8 (M) Assisted blocks: inverted wording/direction

## 7.6 Exercise library

- [ ] LIB-1 (M) Source: free-exercise-db fields
- [ ] LIB-2 (M) Build step produces exercises.json (swap pool), precached images
- [ ] LIB-3 (M) Program custom exercises + placeholder image
- [ ] LIB-4 (M) Exercise detail sheet
- [ ] LIB-5 (B) RepDB illustrations

## 7.7 Breathing

- [ ] BR-1 (M) Setup parameters (speed, rounds, breaths)
- [ ] BR-2 (M) Speed presets to inhale/exhale durations
- [ ] BR-3 (M) Persistent audio/feedback toggles
- [ ] BR-4 (M) Bundled royalty-free tracks
- [ ] BR-5 (M) Session header + hint
- [ ] BR-6 (M) Breathing phase (shape, count, samples, auto to retention)
- [ ] BR-7 (M) Retention phase (stopwatch, previous round, gong)
- [ ] BR-8 (M) Recovery phase (15s countdown, gong)
- [ ] BR-9 (M) Finish early keeps completed rounds
- [ ] BR-10 (S) Visual feedback off mode
- [ ] BR-11 (M) Summary (avg, editable rounds, note, restart/save/discard)
- [ ] BR-12 (M) Saved session record
- [ ] BR-13 (M) Breathing history (charts, totals, calendar)

## 7.8 History

- [x] HIST-1 (M) Workout list
- [ ] HIST-2 (M) Workout detail
- [ ] HIST-3 (M) Exercise history + chart
- [ ] HIST-4 (M) Breathing history (segmented control)
- [ ] HIST-5 (S) Shared month calendar

## 7.9 Settings

- [x] SET-1 (M) Account: Google profile, sign out (delivered in M0 auth; full Account UI in M5)
- [ ] SET-2 (M) Workout timers (defaults created on bootstrap; UI in M5)
- [ ] SET-3 (M) Equipment available (multi-select)
- [ ] SET-4 (M) Breathing settings (defaults created on bootstrap; UI in M5)
- [ ] SET-5 (M) Program: import, start date, reset
- [ ] SET-6 (M) Units (kg) and language
- [ ] SET-7 (B) Export data, delete account data
