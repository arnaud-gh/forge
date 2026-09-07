# PRD: Personal Fitness PWA (working name: "Forge")

| | |
|---|---|
| Version | 1.2 |
| Date | 2026-09-07 |
| Owner | Arnaud (product owner, sole v1 user) |
| Purpose | Single source of truth for building v1 with Claude Code |
| Status | Ready for implementation. Companion documents: `DESIGN.md` v1.1 (design system, source of truth for visuals), `forge-program-arms-neck-core-2026q4.json` (seed program) |

Terminology used in this document: **Program** = imported multi-week plan. **Session** = one scheduled or standalone training unit. **Workout** = a Session being executed or completed (the log). **Block** = one exercise inside a Session with its sets. **Set** = one unit of work with a target.

---

## 1. Problem and context

The owner currently juggles three paid apps, each with far more features than needed:

- **Built With Science** for logging sets (weight, reps, effort) and progressive overload recommendations.
- **Wim Hof Method** for guided breathing with retention tracking.
- **Ladder** for the guided, timer-driven session flow (progress bar, full-screen current exercise, prep time, swap, per-exercise history).

Problem statement: A self-coached lifter struggles to follow one program consistently because the tracking, timing and breathing features he actually uses are split across three subscription apps, each cluttered with unused content. We believe a single, minimal, offline-first PWA containing only those features will remove friction and cost, because every feature in it has already been validated by daily use of the source apps.

## 2. Goals

Measurable (v1 acceptance):
1. A full programmed workout (warm up, supersets, circuit, rep-based and timed sets, rest-pause finisher) can be completed end to end on an iPhone from the home-screen PWA, with airplane mode on, and is synced when the network returns.
2. On the second occurrence of a session, every rep-range block shows a correct recommendation (keep weight / increase weight) derived from the previous performance and effort.
3. A guided breathing session (up to 5 rounds) runs with visual, audio and haptic cues, and its per-round retention times are saved and visible in history.
4. All screens usable one-handed with sweaty hands: primary actions are large, bottom-anchored, and never require precision taps during a set.

Qualitative:
- Feels dynamic and guided during a workout (Ladder), precise and quick for logging (BWS), calm and immersive for breathing (WHM).
- Clean, no clutter: nothing on screen that does not serve the current activity.

## 3. Non-goals (explicitly out of v1)

- Lessons, education content, coach videos or voice guidance.
- Nutrition, food log, body weight, measurements.
- Badges, streaks, gamification, social, sharing, teams, chat.
- Spotify or any music service integration. User-imported audio.
- Apple Watch, heart rate, any external device or service.
- Calendar reminders, push notifications.
- Background audio or vibration when the phone is locked (PWA limitation, accepted; native wrapper is phase 2).
- Program or session editor in the app. Multiple programs and switching.
- Cardio module (backlog), advanced stats (estimated 1RM, volume trends).
- Data export (backlog), lb units (backlog, kg only in v1).
- Native app store distribution (phase 2 via Capacitor).

## 4. Users and platform

- **Primary user (v1):** the owner, iPhone, app installed to home screen as a PWA. Used at home, in the garden and at the gym, often with poor network.
- **Future users:** friends or clients. Data model, auth and security rules must be multi-user from day one; UI stays single-user.
- **Auth:** Google sign-in via Firebase Auth. No email/password.
- **Language:** English UI. i18n wired from day one (react-i18next, all strings in resource files). French is the first planned translation.
- **Units:** kg. Store weights as numbers in kg; unit setting exists but only kg is selectable in v1.

## 5. Technical stack and architecture

Decided after requirements review. Rationale: no server rendering need, offline first, static build reusable in Capacitor later.

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite (SPA) |
| Styling | Tailwind CSS with design tokens from the chosen Claude Design system |
| Animation | Framer Motion (session transitions, progress bar, breathing shape) |
| State | Zustand. In-progress workout and breathing session persisted locally (IndexedDB via idb-keyval or zustand persist) so a reload or app kill never loses a session |
| Backend | Firebase: Auth (Google), Firestore (offline persistence enabled), Hosting |
| PWA | vite-plugin-pwa: manifest, standalone display, iOS meta tags and icons, service worker with precache of app shell, program exercise images and audio tracks |
| Audio | Howler.js. Audio context unlocked on the Start tap (iOS requirement) |
| Device APIs | Screen Wake Lock API (keep screen on during workout and breathing), Vibration API, double-tap gesture handling |
| i18n | react-i18next |
| Charts | Recharts (history charts, minimal styling) |
| Tooling | GitHub, Firebase CLI deploy, ESLint, Prettier, Vitest for logic (timers, progression rules, schedule) |

Architecture principles:
- All timers are timestamp based (start time + duration in ms). The UI derives remaining time from `Date.now()` on every frame. Leaving and returning to the app yields the correct state. No `setInterval` counting.
- Writes go to Firestore through the SDK with offline persistence; the app never blocks on network. Reads use local cache first.
- The exercise library is a static JSON bundled with the app (subset of free-exercise-db filtered at build time to the exercises referenced by the program plus their swap candidates), not a Firestore collection.
- Business rules (progression, set timer duration, schedule state) live in pure TypeScript modules with unit tests, independent of React.

## 6. Navigation

Bottom tab bar (4 tabs): **Home**, **Breathe**, **History**, **Settings**.
The standalone session library ("Extra sessions") is reached from Home. The in-session workout screen and the breathing session screen are full-screen modals over the tabs (tab bar hidden).

---

## 7. Functional requirements

Requirement IDs are stable and referenced in milestones. Priority: M = must (v1), S = should (v1 if time), B = backlog.

### 7.1 Program and schedule

| ID | Req | Pri |
|---|---|---|
| PRG-1 | The app holds exactly one active program, imported from a JSON file matching the schema in section 8 (Settings > Program > Import, and a seed file bundled at build time for development). | M |
| PRG-2 | A program has N weeks. Each week lists sessions assigned to fixed weekdays (Mon to Sun). A session can appear in several weeks (same sessionId) with week-specific overrides (e.g. different set counts). | M |
| PRG-3 | Activating a program sets a start date, aligned to the Monday of the week of activation. Current week index = weeks elapsed since start date. The user can change the start date in Settings. | M |
| PRG-4 | A scheduled session has a state per week: `todo`, `done`, `missed`. A `todo` session can be started on any day of its week, not only its scheduled day. At the end of the week (Sunday 23:59 local), remaining `todo` sessions become `missed`. Missed sessions are not carried over. | M |
| PRG-5 | When the last week ends, the program is `completed`; Home shows a completion state and offers the standalone library. | S |
| PRG-6 | The program file can include a `library` of standalone sessions (stretching, mobility, feel good) that are never scheduled and can be started any day from Home. Completed standalone sessions are logged like any workout. | M |
| PRG-7 | Program-level changes made by the user (kept swaps, kept added exercises, see WRK-22) are stored as an overlay in the user's program state, never by editing the imported file. Re-importing the same program keeps the overlay; importing a different programId replaces the active program and archives the old state. | M |

### 7.2 Home

| ID | Req | Pri |
|---|---|---|
| HOME-1 | Week strip: 7 day cells Monday to Sunday for the current week. Each cell shows day letter and date, a state ring (done = filled, todo = outline, missed = dimmed, rest = plain), the scheduled session name abbreviated below, and small icons for completed activity types that day (strength, breathing). Today is highlighted. Arrows switch weeks; a pull-down gesture or tap expands to a month calendar with the same state coding. | M |
| HOME-2 | Program header: program name and "Week X of N". | M |
| HOME-3 | Today card: if a `todo` session is scheduled today, show its name, estimated duration, exercise count and a Start button. If today is a rest day but a `todo` session remains this week, show that session as "Pending this week" with Start. Otherwise show "Rest day" with quick links to Extra sessions and Breathe. If today's session is done, show a compact summary and the same quick links. | M |
| HOME-4 | Tapping a past day opens a sheet with that day's completed workouts (name, duration, sets done, volume in kg) and breathing sessions (rounds, best and average retention). Tapping an item opens its detail in History. | M |
| HOME-5 | Quick access row: Extra sessions, Breathe, History. Nothing else. No stats, no streaks. | M |
| HOME-6 | If a workout is in progress (persisted locally), Home shows a "Resume workout" banner instead of the Today card. | M |

### 7.3 Session data model (behavioural rules)

| ID | Req | Pri |
|---|---|---|
| SES-1 | A session is an ordered list of **sections**. Section types: `standard` (blocks done one after another), `superset` (2 or more blocks alternated set by set: A1, B1, A2, B2...), `circuit` (blocks done in sequence, repeated for `rounds` rounds, rest between rounds). Sections have a name (e.g. Warm up, Main, Finisher, Cool down). | M |
| SES-2 | A **block** references an exercise (by library id or custom exercise defined in the program), and defines: sets (count and per-set target), rest between sets (seconds), optional prep time (seconds), optional set timer override (seconds), optional notes, optional equipment label, optional list of alternative exercise ids for swap, optional `unilateral: true` (see SES-4), optional `assisted: true` (see SES-6). | M |
| SES-3 | Set target types: `reps` (fixed, e.g. 10), `repRange` (min, max, e.g. 8 to 10), `amrap` (as many reps as possible within the set timer), `duration` (seconds, e.g. 30 s plank), `restPause` (total reps to reach, e.g. 30, in as few chunks as possible). Each set may carry a planned weight (kg) or `bodyweight`. | M |
| SES-3b | Any set may carry `logged: false` (warm-up ramp sets, activation drills). The player shows it as a step with its timer but asks for no weight, reps or effort; a single Done advances. Unlogged sets count in the progress bar but not in volume, and are excluded from progression history. | M |
| SES-3c | Backlog: `maxDuration` set type (stopwatch until failure, logs seconds) for tests and dead hangs. | B |
| SES-4 | Unilateral blocks are executed as two consecutive timed halves per set (Right then Left) with a short switch prompt and no rest between halves. Logged reps and weight are per side. | S |
| SES-6 | `assisted: true` marks a block where the logged weight is a counterweight (assisted chin-ups, assisted dips). Progression is inverted: see PROG-8. The weight label reads "Assist" instead of "Weight". | M |
| SES-5 | Estimated session duration = sum of set timers + rests + prep times, shown on Home and in the pre-session overview. | M |

### 7.4 Workout flow

Pre-session
| ID | Req | Pri |
|---|---|---|
| WRK-1 | Pre-session overview: session name, estimated duration, list of sections and blocks with target (e.g. "3 x 8-10 @ 30 kg", "3 x 30 s", "AMRAP 60 s", "Rest-pause 30 reps"), planned weight pre-filled from the recommendation (section 7.5), and a Start button. Swap and remove are available here too. | M |
| WRK-2 | Starting a session creates a local in-progress workout record, requests the wake lock, unlocks audio, and enters the full-screen player. | M |

Full-screen player
| ID | Req | Pri |
|---|---|---|
| WRK-3 | Top area: progress bar segmented by section (segments proportional to estimated section time, active segment highlighted), elapsed session time, percentage complete (completed sets / total sets). Close (X) with confirmation. List icon (or swipe down) opens the session list (WRK-14). | M |
| WRK-4 | Current step area: section name, exercise name, "Set x of y" (superset: "A1 · Set 1 of 3"; circuit: "Round 2 of 4"), target, exercise image (start/end pose alternating slowly or toggle on tap), and the previous performance for this set (e.g. "Last: 30 kg x 9, Ideal" with effort colour dot). | M |
| WRK-5 | Set timer: a countdown for the set, rendered as giant numerals plus a linear progress bar per DESIGN.md (no ring). Duration = set timer override if defined, else for `duration` sets the duration itself, else the global rule from Settings (secondsPerRep x target reps (max of range) + margin; defaults 3 s and 10 s, tuned on the first program). For `amrap` the timer is the block's defined duration. For `restPause` no set timer; a stopwatch runs instead. | M |
| WRK-6 | Inputs on the set screen: weight (kg, stepper in 2.5 kg steps with long-press repeat, tap on the value opens a numeric keypad, pre-filled), reps (stepper in steps of 1, pre-filled with target max or previous), effort selector with three options: Easy (could have done 3+ more), Ideal (1 to 3 left), Max effort (no more reps with good form). For `duration` sets: a Done toggle only. For `restPause`: weight, number of chunks, reps confirmation. | M |
| WRK-7 | Confirming the set: selecting effort (or Done) logs the set and moves to rest. If the set timer is still running when confirmed, the remaining set time is added to the following rest ("bonus rest"). | M |
| WRK-8 | If the set timer reaches zero before confirmation, play sound + vibrate and show a soft prompt ("Time's up, log your set"); the set stays open until confirmed. The user can pause the set timer, or restart the set (reset timer to full). | M |
| WRK-9 | Manual navigation: swipe right or a "Next" control advances to the next step; swipe left or "Back" returns to the previous step (logged data preserved). | M |
| WRK-10 | Rest screen: countdown (giant numerals plus linear bar), "Next: <exercise>, Set x" preview with image, +15 s and Skip buttons. Sound + vibration at zero, then auto-advance to the next set. | M |
| WRK-11 | Prep time: before the first set of a block, if the block has prep time (or the user taps "Add prep time", which adds the Settings default, tappable repeatedly), a prep countdown runs with the exercise preview. | M |
| WRK-12 | Superset execution: A1, rest (if defined between exercises, default 0), B1, rest, A2... Circuit execution: all blocks in order, then rest between rounds, for N rounds. Progress labels reflect this. | M |
| WRK-13 | Skip section: available from the section header in the list; confirms, marks remaining sets as skipped. | S |
| WRK-14 | Session list (swipe down): all sections and blocks with per-set status (done with logged values, current, upcoming, skipped). Actions per block: Go to set, Edit sets (add or remove sets for this workout), Swap, Notes, Remove. Section action: Skip section. Bottom action: Add exercise. | M |
| WRK-15 | Swap: opens a picker showing first the block's program-defined alternatives, then automatic suggestions from the library: same primary muscle(s), filtered by the user's available equipment (Settings), sorted by number of matching secondary muscles. Search field. Swapping keeps set structure and targets; planned weight is cleared unless the new exercise has history. | M |
| WRK-16 | Add exercise: picker over the full library (search, filter by muscle and equipment). The user sets number of sets, target type and rest; defaults 3 x 8-12, 90 s. Added at the end of the current section or as a new block in a chosen section. | M |
| WRK-17 | Notes: free text per block, saved with the workout and shown next time as "Last note". | M |
| WRK-18 | Pause: a global pause freezes all timers and the elapsed clock. | M |
| WRK-19 | Finish: available anytime. If sets remain, confirm "Finish with X sets not done?". Discard: confirm, deletes the in-progress workout. | M |
| WRK-20 | Persistence: every logged set writes to the local in-progress record immediately. Killing and reopening the app resumes at the exact step with correct timers (timestamp based). Screen stays awake via Wake Lock; if the wake lock is lost (OS), it is re-requested on visibility change. | M |
| WRK-21 | End-of-session summary: duration, sets done / planned, total volume (kg), list of blocks with logged sets, weight increases achieved (blocks where weight > last time), notes field, Save. | M |
| WRK-22 | If the workout contained swaps, added or removed exercises, or set count edits, the summary shows "You changed this session" with a per-change list and a toggle "Keep for future sessions" (default on). Kept changes are written to the program overlay (PRG-7) for that sessionId. Not kept changes affect this workout only. | M |
| WRK-24 | Undo: after a set is logged, a toast "Set logged" with an UNDO action stays 3 s; undo reopens that set with its values and cancels the rest timer. | S |
| WRK-23 | Sound and haptics: distinct short sounds for set end, rest end and workout complete; vibration pattern on each; all toggleable in Settings. Countdown beeps for the last 3 seconds of rest (toggleable, default off). | S |

### 7.5 Progression logic (progressive overload)

Applies to blocks with `repRange` or `reps` targets and a weight. Computed when a session is opened (pre-session overview) from the most recent completed workout containing the same block (same sessionId + blockId, or same exerciseId if the block was swapped).

| ID | Rule | Pri |
|---|---|---|
| PROG-1 | Baseline: pre-fill each set's weight with the weight used last time for that set index (fallback: last weight used on that exercise anywhere; fallback: program planned weight; fallback: empty). | M |
| PROG-2 | Increase: if every working set last time reached the target max reps (for `reps`: the fixed count) AND no set was rated Max effort, show recommendation "Increase weight" with the last weight pre-filled and the weight field highlighted. The user types the new weight; the app never chooses the increment. Target shown becomes the range minimum. | M |
| PROG-3 | Hold: if reps were inside the range on all sets, or any set hit the max at Max effort, show "Same weight, aim for {max} reps". | M |
| PROG-4 | Below range: if any set was below the range minimum, show "Same weight, work back into {min}-{max}". No automatic decrease. | M |
| PROG-5 | The recommendation is a suggestion chip on the set screen and in the overview. Any user value overrides it silently. | M |
| PROG-6 | `amrap`, `duration`, `restPause` and bodyweight blocks: no recommendation; show previous best (reps, seconds, or chunks) as reference. | M |
| PROG-7 | First occurrence of a block (no history): no chip, planned weight from the program if any. | M |
| PROG-8 | Assisted blocks (SES-6): same conditions as PROG-2 to PROG-4, with inverted wording and direction. Increase condition shows "Decrease assist" (user types the lower counterweight); hold shows "Same assist, aim for {max} reps"; below range shows "Same assist, work back into {min}-{max}". "Weight increases achieved" in WRK-21 counts assist decreases for these blocks. | M |

### 7.6 Exercise library

| ID | Req | Pri |
|---|---|---|
| LIB-1 | Source: free-exercise-db (public domain). Fields used: id, name, equipment, primaryMuscles, secondaryMuscles, instructions, images (2 poses), category, mechanic. | M |
| LIB-2 | A build step produces `exercises.json` containing the exercises referenced by the program, their declared alternatives, and all exercises sharing a primary muscle with them (swap pool). Images are copied into the app assets and precached by the service worker. | M |
| LIB-3 | The program file can define custom exercises (same shape, own image URLs or none). A generic placeholder illustration is used when no image exists. | M |
| LIB-4 | Exercise detail sheet (from any exercise name): images, instructions, equipment, muscles, and the exercise history (HIST-3). | M |
| LIB-5 | Backlog: evaluate RepDB flat illustrations as an alternative image set (attribution required). | B |

### 7.7 Breathing module (Wim Hof style)

Setup screen
| ID | Req | Pri |
|---|---|---|
| BR-1 | Session parameters (remembered between sessions): speed preset (Slow / Standard / Fast), rounds (1 to 5), breaths before retention (20, 25, 30, 35, 40). Start button. | M |
| BR-2 | Speed presets map to inhale and exhale durations in seconds, editable in Settings. Defaults: Slow 5/5, Standard 3/3, Fast 2/2. To be tuned by the owner. | M |
| BR-3 | Persistent audio settings (on the setup screen, collapsed): background music on/off; breathing phase music on/off + track choice; retention phase music on/off + track choice; breathing sounds (inhale/exhale samples) on/off; visual feedback on/off; haptic feedback on/off; ping/gong at transitions on/off. | M |
| BR-4 | Music tracks: a small set of royalty free tracks bundled with the app (2 to 3 for breathing phase, 2 to 3 for retention phase), loopable. Track list defined in a config file. No user import. | M |

Session flow (full screen, tab bar hidden, wake lock on)
| ID | Req | Pri |
|---|---|---|
| BR-5 | Header: "Round x / y", Finish button. Hint at the bottom: "Tap twice to go into retention" (then "Tap twice to go into recovery breath"). | M |
| BR-6 | Breathing phase: a central shape (hexagon or design-system equivalent) expands on inhale and contracts on exhale following the preset timing, with the breath count in the centre. Inhale/exhale samples play in sync if enabled. Breathing phase music plays if enabled. After the last breath, the app moves to retention automatically. Double tap at any time jumps to retention. | M |
| BR-7 | Retention phase: instruction "Let go and hold", shape at rest state, stopwatch counting up from 00:00, "Previous round: mm:ss" if applicable. Retention music starts at the beginning of this phase (breathing music stops). Gong at transition. Double tap ends retention and moves to recovery. | M |
| BR-8 | Recovery phase: instruction "Take a deep breath in and hold", 15 s countdown (duration in Settings). Gong at start and end. Then the next round starts automatically, or the session ends after the last round. | M |
| BR-9 | Finish early: keeps completed rounds and goes to the summary (or discards if no round completed). | M |
| BR-10 | Visual feedback off: the screen shows only text and counters, no animation. Haptic: short pulse on each transition, light pulse at each breath count if enabled. | S |

Summary and history
| ID | Req | Pri |
|---|---|---|
| BR-11 | Summary: average retention, list of rounds with retention time (editable via a time field, deletable), note field, Restart, Save, Discard. | M |
| BR-12 | Saved session record: date, parameters (speed, rounds, breaths), per-round retention seconds, average, best, note. | M |
| BR-13 | Breathing history (History tab): bar chart per session (longest and average retention), totals (sessions, rounds, total retention time), calendar view with per-day summary (sessions, rounds, total, average). Personal best highlighted. | M |

### 7.8 History

| ID | Req | Pri |
|---|---|---|
| HIST-1 | Workout list: reverse chronological, each row with date, session name, duration, sets done, volume. Filter: program sessions / extra sessions. | M |
| HIST-2 | Workout detail: everything logged (sections, blocks, sets with weight, reps, effort, notes, swaps applied). | M |
| HIST-3 | Exercise history: from an exercise detail sheet, list of past occurrences (date, session, sets as weight x reps with effort colour) and a simple chart of max weight per occurrence. | M |
| HIST-4 | Breathing history as BR-13. Segmented control at the top of History: Workouts / Breathing. | M |
| HIST-5 | Calendar view (month) shared between workouts and breathing, reusing the Home month component. | S |

### 7.9 Settings

| ID | Req | Pri |
|---|---|---|
| SET-1 | Account: Google profile, sign out. | M |
| SET-2 | Workout timers: seconds per rep (default 3), set margin seconds (default 10), default rest (default 90 s), default prep time (default 30 s), rest countdown beeps on/off, sounds on/off, vibration on/off. | M |
| SET-3 | Equipment available: multi-select from the library's equipment list (used for swap suggestions). | M |
| SET-4 | Breathing: speed preset durations (inhale/exhale per preset), recovery hold duration, default audio toggles. | M |
| SET-5 | Program: import JSON (file picker), show active program name and start date, edit start date, reset program state (confirm). | M |
| SET-6 | Units (kg only, disabled control), language (English, others later). | M |
| SET-7 | Backlog: export data (JSON), delete account data. | B |

---

## 8. Program file schema (JSON)

The program is authored in a separate Claude Project chat and imported as a file. Version the schema so the importer can validate and migrate.

```jsonc
{
  "schemaVersion": 1,
  "programId": "hypertrophy-2026-q4",
  "name": "Hypertrophy Q4 2026",
  "weeks": 8,
  "exercises": [                      // optional custom exercises not in the library
    {
      "id": "custom-banded-neck-protraction",
      "name": "Banded neck protraction",
      "equipment": "bands",
      "primaryMuscles": ["neck"],
      "secondaryMuscles": [],
      "instructions": ["..."],
      "images": []                    // relative paths bundled with the app, or empty
    }
  ],
  "sessions": [
    {
      "id": "push-a",
      "name": "Push A",
      "sections": [
        {
          "id": "warmup",
          "name": "Warm up",
          "type": "standard",         // standard | superset | circuit
          "blocks": [
            {
              "id": "wu-1",
              "exerciseId": "Arm_Circles",
              "sets": [ { "type": "duration", "seconds": 30, "logged": false } ],
              "restSeconds": 0
            }
          ]
        },
        {
          "id": "main",
          "name": "Main",
          "type": "standard",
          "blocks": [
            {
              "id": "bench",
              "exerciseId": "Barbell_Bench_Press_-_Medium_Grip",
              "sets": [
                { "type": "repRange", "min": 8, "max": 10, "weightKg": 60 },
                { "type": "repRange", "min": 8, "max": 10, "weightKg": 60 },
                { "type": "repRange", "min": 8, "max": 10, "weightKg": 60 }
              ],
              "restSeconds": 120,
              "prepSeconds": 45,
              "setTimerSeconds": 75,      // optional override of the global rule
              "notes": "Pause 1 s on chest",
              "alternatives": ["Dumbbell_Bench_Press", "Pushups"]
            }
          ]
        },
        {
          "id": "ss1",
          "name": "Superset",
          "type": "superset",
          "restBetweenExercisesSeconds": 0,
          "blocks": [
            { "id": "ss1-a", "exerciseId": "Seated_Cable_Rows", "sets": [ { "type": "repRange", "min": 10, "max": 12, "weightKg": 40 } ], "restSeconds": 90 },
            { "id": "ss1-b", "exerciseId": "Lateral_Raise_-_With_Bands", "sets": [ { "type": "repRange", "min": 12, "max": 15 } ], "restSeconds": 90 }
          ]
        },
        {
          "id": "circuit",
          "name": "Intervals",
          "type": "circuit",
          "rounds": 4,
          "restBetweenRoundsSeconds": 60,
          "blocks": [
            { "id": "c-1", "exerciseId": "Burpee", "sets": [ { "type": "amrap", "seconds": 40 } ] },
            { "id": "c-2", "exerciseId": "Plank", "sets": [ { "type": "duration", "seconds": 30 } ] }
          ]
        },
        {
          "id": "finisher",
          "name": "Finisher",
          "type": "standard",
          "blocks": [
            { "id": "curl-rp", "exerciseId": "Dumbbell_Bicep_Curl", "sets": [ { "type": "restPause", "totalReps": 30, "weightKg": 10 } ], "restSeconds": 0 }
          ]
        }
      ]
    }
  ],
  "schedule": [
    { "week": 1, "days": { "mon": "push-a", "wed": "pull-a", "fri": "legs-a" } },
    { "repeat": "2-4", "days": { "mon": "push-a", "wed": "pull-a", "fri": "legs-a" },
      "overrides": { "push-a": { "bench": { "setCount": 4 } } } },
    { "week": 5, "days": { "mon": "push-a", "wed": "pull-a", "fri": "legs-a" },
      "overrides": { "push-a": { "bench": { "setCount": 2 } } } }
  ],
  "library": [
    { "id": "mobility-15", "name": "15 min mobility", "sections": [ ] }
  ]
}
```

Rules:
- `sets` is the per-set list for one block. `setCount` in overrides resizes the block: if larger, the last set definition is replicated; if smaller, the list is truncated to the first `setCount` sets.
- Overrides attached to a `repeat` entry apply to every week in the range, exactly as if the entry had been expanded into one `week` entry per week.
- Block fields `assisted: true` (SES-6) and `unilateral: true` (SES-4) and set field `logged: false` (SES-3b) are optional and default to false / true respectively.
- Weekdays not listed are rest days. A `schedule` entry can also use `"repeat": "1-8"` shorthand to apply the same days to a range of weeks; the importer expands it.
- Exercise ids reference free-exercise-db ids or custom ids declared in `exercises`.
- The importer validates against a JSON Schema and reports readable errors (unknown exerciseId, missing weeks, invalid set type).

## 9. Data model (Firestore)

All user data under `users/{uid}`. Security rules: a user can read and write only their own subtree.

```
users/{uid}
  profile: { displayName, photoURL, createdAt }
  settings: { timers, equipment[], breathing, audio, units, language }

users/{uid}/programs/{programId}
  file: <imported JSON as stored>           (or Storage ref if > 1 MB)
  state: { startDate, status: active|completed|archived, overlay: { [sessionId]: { swaps, addedBlocks, removedBlocks, setCounts } }, weeks: { [weekIndex]: { [sessionId]: todo|done|missed } } }

users/{uid}/workouts/{workoutId}
  { programId, sessionId, weekIndex | null, isStandalone, startedAt, endedAt, durationSec,
    sections: [ { id, name, type, blocks: [ { id, exerciseId, swappedFrom?, sets: [ { index, type, target, weightKg?, reps?, seconds?, chunks?, effort?, status: done|skipped, loggedAt } ], notes? } ] } ],
    totals: { setsDone, setsPlanned, volumeKg }, note?, changesKept: [...] }

users/{uid}/breathingSessions/{id}
  { startedAt, speed, inhaleSec, exhaleSec, rounds, breaths, retentions: [sec], avgSec, bestSec, note? }
```

Local only (IndexedDB): `inProgressWorkout`, `inProgressBreathing` (full state with timer anchors), settings cache. Firestore offline persistence handles everything else.

## 10. Non-functional requirements

| Area | Requirement |
|---|---|
| Offline | Full workout and breathing session without network. History and program readable from cache. Writes queue and sync on reconnect (Firestore SDK). App shell, exercise images and audio precached at install; a "Download for offline" step runs after program import. |
| Timers | Precision within 100 ms over a 90 minute session; derived from timestamps, rendered with requestAnimationFrame. Correct after backgrounding. |
| Screen | Wake lock during workout and breathing; released on finish, discard or leaving the player. |
| Audio | Works with the iOS silent switch behaviour documented; audio unlocked on user gesture; music loops seamlessly; volumes independent (music vs cues). |
| Performance | First load under 2 s on 4G, interactions under 100 ms, animations at 60 fps on iPhone 13 class devices. |
| PWA | Installable, standalone display, safe-area insets respected, no browser chrome, splash icons for iOS. |
| Security | Firebase rules per uid; no public data. Google sign-in only. |
| Accessibility | Minimum 48 px touch targets in the player, high contrast in dark environments, dark theme by default (light theme optional in the design system). |
| Testing | Unit tests for: schedule state (PRG-3, PRG-4), set timer rule (WRK-5), progression rules (PROG-1 to 7), superset and circuit sequencing (WRK-12), breathing state machine (BR-6 to 8), importer validation. |

## 11. Milestones

| Milestone | Scope | Done when |
|---|---|---|
| M0 Foundation | Vite + React + TS scaffold, Tailwind with design tokens, Firebase Auth (Google), Firestore rules, PWA shell, i18n, navigation, empty screens | App installs on iPhone, sign in works, offline shell loads |
| M1 Program | Importer + validation, seed program, schedule engine, Home (week strip, today card, month view, day sheet), Extra sessions list | Home reflects the seed program correctly across weeks, including missed logic |
| M2 Player core | Pre-session overview, full-screen player for standard sections (repRange, reps, duration), set and rest timers, logging, persistence and resume, summary and save | A standard session can be completed offline and appears in History |
| M3 Player advanced | Supersets, circuits, AMRAP, rest-pause, unilateral, prep time, session list actions (go to set, edit sets, notes, swap, add, remove, skip section), keep-changes flow, progression recommendations, sounds and haptics | Acceptance goals 1 and 2 |
| M4 Breathing | Setup, session state machine, animation, audio (music, samples, gong), haptics, summary, history and chart | Acceptance goal 3 |
| M5 History and Settings | Workout list and detail, exercise history and chart, calendar, all settings, equipment list, offline asset download step | Full v1 feature list |
| M6 Polish | Animation pass, empty states, error states, importer error messages, performance and offline QA on device | Owner uses it as the only training app for 2 weeks |

Phase 2 (not planned in detail): Capacitor wrapper with local notifications and background audio, cardio module, program editor and multi-program switching, French translation, RepDB illustrations, data export, lb units.

## 12. Assumptions and open points

1. App name is a placeholder ("Forge"); to be chosen with the design direction.
2. Default timer rule values (3 s per rep, 10 s margin, 90 s rest, 30 s prep) come from the first program's notes; the owner tunes them in Settings.
3. Breathing speed durations (5/5, 3/3, 2/2) are the owner's estimates, not verified against the WHM app; editable in Settings.
4. Rest-pause logging = weight, number of chunks, total time (stopwatch). Recommendation logic does not apply.
5. Unilateral handling (SES-4) is "should"; if it complicates the player, v1 can model left and right as two blocks in the program file.
6. Royalty free music sources to review when building M4: Pixabay Music, Free Music Archive (CC0 / CC BY), Incompetech. Breathing samples: Freesound (CC0). Credits listed in Settings > About if a licence requires attribution.
7. Program overlays (kept swaps) are per sessionId; a swap kept in "Push A" week 2 applies to all later weeks of "Push A".
8. Standalone sessions never receive progression recommendations across occurrences in v1 (they do show previous performance).
9. The seed program for development is `forge-program-arms-neck-core-2026q4.json` (10 weeks, 6 sessions, 3 standalone, 68 exercises of which 16 custom without images). Its companion `forge-program-notes.md` holds coaching rules the app does not enforce.

## 13. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-06 | Initial PRD |
| 1.2 | 2026-09-07 | Aligned with DESIGN.md v1.1: countdown rendering (WRK-5, WRK-10), stepper inputs (WRK-6), undo last set (WRK-24), companion documents in status. |
| 1.1 | 2026-09-07 | Validated against the first program file. Added SES-3b (`logged: false` sets), SES-3c backlog (`maxDuration`), SES-6 and PROG-8 (`assisted` blocks), importer rules for `setCount` truncation and overrides on `repeat` ranges, timer defaults changed to 3 s / 10 s, seed program reference. |
