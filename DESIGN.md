# Forge Design System

Version 1.1 (2026-09-07). Aligned with PRD v1.2. Changes vs 1.0: session list sheet redefined, end-of-session summary completed, breathing setup aligned on presets, settings sections completed, player states added (prep, pause, unlogged sets, rest-pause, superset and circuit labels, assisted blocks), timer size clamp, resume banner, confirmation dialogs, extra sessions and add-exercise picker.

Direction: **Instrument, final** (option 2a). Cool graphite monochrome, one amber signal colour, hairline grid, Anton display numerals, Archivo UI text. Breathing mode reuses the same skeleton with an ice blue signal and dimmed chrome. Reference mockups: `Forge Directions.dc.html`, section 2 (keep that file in the repo under `design/`; this document is the source of truth when they disagree).

Stack targets: Tailwind CSS + Framer Motion, Google Fonts (Anton, Archivo). Dark theme only for v1.

---

## 1. Tokens

### 1.1 CSS custom properties

```css
:root {
  /* Background layers */
  --bg-app: #0B0D10;        /* app background, all workout screens */
  --bg-deep: #080A0D;       /* breathing screens, deepest layer */
  --bg-surface: #10141A;    /* image wells, inset surfaces */
  --bg-panel: rgba(13, 16, 21, 0.85); /* panels floating over photography */

  /* Borders (all hairline, cool-tinted) */
  --border-faint: rgba(200, 220, 240, 0.08);  /* internal dividers */
  --border-default: rgba(200, 220, 240, 0.12); /* cards, containers */
  --border-strong: rgba(200, 220, 240, 0.15);  /* inputs, icon buttons */
  --border-emphasis: rgba(200, 220, 240, 0.25); /* secondary buttons */

  /* Text */
  --text-primary: #E6ECF2;
  --text-secondary: #B9C4CE;
  --text-muted: #76828F;    /* labels, meta */
  --text-faint: #5A6570;    /* inactive tabs, de-emphasised chrome */
  --text-ghost: #3D4650;    /* rest days, hints, disabled */

  /* Accent: workout */
  --accent: #FFB000;        /* amber signal, one per screen region */
  --accent-ink: #0B0D10;    /* text/icons on amber */
  --accent-dim: rgba(255, 176, 0, 0.14);   /* selected fills */
  --accent-border: rgba(255, 176, 0, 0.45);/* chip outlines */
  --accent-wash: rgba(255, 176, 0, 0.06);  /* today column tint */

  /* Accent: breathing */
  --breath: #9EB8C9;        /* ice blue signal */
  --breath-dim: rgba(158, 184, 201, 0.16);
  --breath-faint: rgba(158, 184, 201, 0.07);
  --breath-border: rgba(158, 184, 201, 0.45);

  /* Semantic */
  --success: #63C68C;
  --warning: #FFB000;       /* shares accent */
  --danger: #FF5C33;

  /* Effort */
  --effort-easy: #8FB3CC;
  --effort-ideal: #FFB000;  /* shares accent */
  --effort-max: #FF5C33;    /* shares danger */

  /* Typography */
  --font-display: 'Anton', sans-serif;   /* single weight 400 */
  --font-ui: 'Archivo', sans-serif;      /* 400 to 700 */

  /* Radii */
  --radius-xs: 3px;   /* chips, thumbnails, stepper buttons */
  --radius-sm: 4px;   /* cards, buttons, inputs, panels */
  --radius-full: 9999px; /* status dots only */

  /* Spacing scale (px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-14: 56px;
  --gutter: 24px;            /* screen horizontal padding, everywhere */

  /* Shadows and glows (use sparingly) */
  --shadow-text-photo: 0 2px 30px rgba(11, 13, 16, 0.7); /* type over photos */
  --glow-breath: 0 0 60px rgba(158, 184, 201, 0.12);     /* breathing shape only */

  /* Z-layers */
  --z-base: 0;
  --z-photo-overlay: 1;   /* gradient scrim over exercise photo */
  --z-content: 2;         /* everything above the scrim */
  --z-tabbar: 10;
  --z-sheet-scrim: 30;
  --z-sheet: 40;
  --z-toast: 50;

  /* Motion */
  --duration-tap: 120ms;      /* press feedback, stepper ticks */
  --duration-state: 200ms;    /* selection, chip, tab changes */
  --duration-screen: 300ms;   /* set to rest, sheet open */
  --duration-phase: 500ms;    /* rest to next set, breathing phase cross-fade */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --ease-breath: cubic-bezier(0.37, 0, 0.63, 1); /* sine in-out, breathing shape only */
}
```

### 1.2 tailwind.config extension

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { app: '#0B0D10', deep: '#080A0D', surface: '#10141A' },
        line: {
          faint: 'rgba(200,220,240,0.08)',
          DEFAULT: 'rgba(200,220,240,0.12)',
          strong: 'rgba(200,220,240,0.15)',
          emphasis: 'rgba(200,220,240,0.25)',
        },
        ink: {
          DEFAULT: '#E6ECF2', secondary: '#B9C4CE', muted: '#76828F',
          faint: '#5A6570', ghost: '#3D4650',
        },
        accent: { DEFAULT: '#FFB000', ink: '#0B0D10' },
        breath: { DEFAULT: '#9EB8C9' },
        success: '#63C68C',
        warning: '#FFB000',
        danger: '#FF5C33',
        effort: { easy: '#8FB3CC', ideal: '#FFB000', max: '#FF5C33' },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        ui: ['Archivo', 'sans-serif'],
      },
      fontSize: {
        // Display (Anton 400, uppercase, tabular-nums on numerals)
        'timer-xl': ['148px', { lineHeight: '1', letterSpacing: '0.02em' }], // rest timer
        'timer-lg': ['110px', { lineHeight: '1', letterSpacing: '0.02em' }], // set timer
        'timer-md': ['92px',  { lineHeight: '1', letterSpacing: '0.02em' }], // breath stopwatch
        'display-lg': ['52px', { lineHeight: '1' }],    // screen title (Legs A)
        'display-md': ['40px', { lineHeight: '0.95' }], // exercise name in player
        'display-sm': ['34px', { lineHeight: '1' }],    // home header (Week 3/8)
        'value': ['28px', { lineHeight: '1' }],         // stepper values
        'display-xs': ['22px', { lineHeight: '1' }],    // next-up name, list rows
        'btn-lg': ['20px', { lineHeight: '1', letterSpacing: '0.06em' }],
        'btn': ['16px', { lineHeight: '1', letterSpacing: '0.06em' }],
        'btn-sm': ['14px', { lineHeight: '1', letterSpacing: '0.06em' }],
        // UI (Archivo)
        'body': ['13px', { lineHeight: '1.45' }],
        'meta': ['12px', { lineHeight: '1.4' }],
        'label': ['11px', { lineHeight: '1', letterSpacing: '0.14em' }],  // section labels
        'label-sm': ['10px', { lineHeight: '1', letterSpacing: '0.14em' }],
        'label-xs': ['9px',  { lineHeight: '1', letterSpacing: '0.14em' }],
      },
      borderRadius: { xs: '3px', sm: '4px' },
      boxShadow: { breath: '0 0 60px rgba(158,184,201,0.12)' },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        breath: 'cubic-bezier(0.37, 0, 0.63, 1)',
      },
      transitionDuration: { tap: '120ms', state: '200ms', screen: '300ms', phase: '500ms' },
      zIndex: { tabbar: '10', scrim: '30', sheet: '40', toast: '50' },
    },
  },
};
```

Font loading:

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Timer numerals rule: every number that changes over time (timers, stopwatches, steppers, elapsed time in the top bar) uses `font-variant-numeric: tabular-nums` so digits never shift horizontally. Anton for large values, Archivo 600 for small inline ones.

---

## 2. Components

States listed as: default / pressed / selected / disabled. Pressed is always the same recipe: scale 0.97 plus brightness 1.1, duration-tap, ease-standard. Visual reference for each: section 2 of the mockup file.

### Buttons
- **Primary (large bottom action)**: h-56 to 58px, full width or flex-1, bg accent, text accent-ink, font-display btn-lg (btn on paired rows), radius-sm, uppercase. Disabled: bg line-strong, text ink-faint.
- **Secondary**: same geometry, transparent bg, 1px border-emphasis, text ink. Pairs left of a primary (example: +15 S next to SKIP REST).
- **Ghost**: no border, text ink-muted, label typography. For FINISH, footer links.
- **Destructive**: secondary geometry with border and text in danger. Confirmation actions only.
- **Icon button**: 44px square, radius-sm, 1px border-strong, icon ink-muted. Over photography add bg-panel.

### Numeric inputs (weight, reps)
Stepper panel: radius-sm, 1px border-strong, label-xs uppercase muted on top, then minus / value / plus row. Value: font-display value size, tabular-nums. Stepper buttons: 32px square minimum (44px hit area via padding), radius-xs, border-strong. Weight steps 2.5 kg, reps steps 1. Long-press repeats. Tap on the value opens a numeric keypad sheet. Changed-but-unlogged value shows in accent.

### Effort selector
Three flex-1 cells, h-60px, radius-sm, gap-8. Each: 6px effort-colour dot above font-display btn-sm label (EASY / IDEAL / MAX). Unselected: border-emphasis, text ink. Selected: 1px border in effort colour, bg effort colour at 14 percent, label in effort colour. Selecting logs the set: one selector state change, then the player advances after 250 ms.

### Chips (recommendation)
Radius-xs, 1px accent-border, text accent, Archivo 700 10px, uppercase, tracking 0.04em, padding 5px 10px. One chip max per screen. Informational grey variant: border-emphasis, text ink-secondary.

### Cards
- **Today card**: radius-sm, 1px border-default, padding 22px 20px. Label row (TODAY label in accent, status label in muted), display-lg title, meta line, primary button.
- **Day summary / next-up card**: radius-sm, 1px border-default, padding 14px 16px, row layout: photo thumb (radius-xs, 1px border-strong) then label-sm accent kicker, display-xs name, meta line.
- Cards never nest more than one level. Panels over photography use bg-panel instead of transparent.

### Week strip day cell
One bordered container (radius-sm, border-default), 7 flex-1 columns split by border-faint. Cell: weekday letter (label-sm), date (Anton 17px), 18px state ring, session label (label-xs). States:
- **Done**: filled accent circle, labels ink-secondary.
- **Todo**: dashed ghost circle outline, labels ink-ghost.
- **Missed**: dashed ghost outline plus small danger dot at ring centre.
- **Rest**: 4px ghost dot, REST label ink-ghost.
- **Today**: inset 2px accent top bar, accent-wash column fill, weekday letter accent, 2px solid ink ring.

### Segmented progress bar
3px tall, gap-3px, square ends, one segment per exercise, flex weight = set count. Done: ink at 45 percent. Current: track at 14 percent with accent fill from left, animating per logged set. Upcoming: track only. Sits directly under the player top bar, full gutter width.

### Player step variants
All share the set screen skeleton (top bar, segmented bar, photo, name, giga timer, bottom action). Only the middle block and the bottom action change.
- **Step label**: label-sm accent kicker above the exercise name. Standard: `SET 2 OF 3`. Superset: `A1 · SET 1 OF 3` (letter = block position in the superset). Circuit: `ROUND 2 OF 4 · 3 OF 5` (round, then exercise position). Unilateral: appends `· RIGHT` then `· LEFT`.
- **Prep step**: kicker `PREP`, giga timer in ink (timer-lg), caption `GET READY`, next exercise card in the header position, bottom action = secondary `+30 S` and primary `START SET`. No inputs.
- **Unlogged set** (`logged: false`, warm-up ramps): same as a set step but no stepper panel and no effort selector; caption `WARM-UP · NOT LOGGED`; bottom action = single primary `DONE`.
- **Rest-pause set**: no countdown, giga stopwatch counting up (timer-lg, ink), caption `TOTAL 30 REPS`, stepper panel with weight and `CHUNKS` (reps stepper relabelled, step 1), bottom action = effort selector as usual.
- **AMRAP set**: countdown as a normal set, reps stepper pre-filled at 0, caption `AS MANY AS POSSIBLE`.
- **Assisted block**: weight stepper label reads `ASSIST` instead of `WEIGHT`; recommendation chips use the assist wording (PRD PROG-8).
- **Paused**: a full-screen scrim (black 60 percent, z-scrim) with `PAUSED` in display-lg, the elapsed time frozen underneath in timer-md, and one primary `RESUME`. All timers frozen. Entered from the top-bar pause icon button.

### Giga timer
The signature element. Anton, tabular-nums, no ring ever. Sizes: rest 148px in accent, set 110px in ink (over photo: text-shadow shadow-text-photo), breath stopwatch 92px in ink. Under the numerals: linear progress bar (4 to 5px, track ink at 14 to 20 percent, fill accent), then a label-xs caption (SET TIME, OF 2:00). Counting down, the last 5 seconds tick-pulse: scale 1.03 and back, 120 ms per tick. Size clamp: the sizes above hold for values up to 4 characters ("1:30"). From 5 characters ("12:30", "1:02:15") step down one size (timer-xl to timer-lg to timer-md) so the value never exceeds the gutter width; never wrap or shrink below timer-md.

### Breathing shape
Concentric hexagon, stroke breath-border outer, breath-faint fill inner, glow-breath. Breath count centred inside in Anton timer-md.
- **Inhale**: inner hexagon scales 0.55 to 1.0 over the configured inhale seconds, ease-breath.
- **Exhale**: scales back 1.0 to 0.55 over the configured exhale seconds, ease-breath.
- **Rest / retention**: shape holds at 0.55, static, opacity 0.8. Nothing pulses during retention, the stopwatch is the only moving element.

### Bottom tab bar
4 items (Home, Breathe, History, Settings), 1px border-faint top, padding 12px 28px 8px plus home indicator zone. Item: 22px stroke icon over label-xs uppercase. Active: accent. Inactive: ink-faint. No badges, no dots. Hidden inside player and breathing sessions.

### Sheets (session list, exercise detail, keypad)
Slide up from bottom, bg-app, radius-sm top corners only, 1px border-default top, grab handle (36px by 4px, ink at 30 percent), scrim black at 60 percent (z-scrim). Enter: y from 100 percent, duration-screen, ease-standard. Max height 85 percent of viewport. Title row: display-xs plus ghost close button.

### Toasts
Bottom-anchored above the tab bar or bottom action, bg-surface, 1px border-default, radius-sm, meta text ink-secondary, left 3px bar in success / warning / danger. One line, auto-dismiss 3 s, slide plus fade, duration-state. Used only for undo (Set logged, UNDO ghost button) and sync notices.

### Resume banner (Home)
Replaces the Today card while a workout is in progress. Same card geometry with a 1px accent border, label row `IN PROGRESS` in accent plus elapsed time in muted (frozen if paused), display-lg session name, meta `12 of 24 sets done`, primary `RESUME` and ghost `DISCARD`.

### Confirmation dialogs
Centered panel (not a sheet): bg-app, 1px border-default, radius-sm, padding 24px, max width 320px, over the z-scrim. Title display-xs, one body line ink-secondary, two buttons in a row: secondary `CANCEL` and destructive or primary confirm. Used for Finish with sets remaining, Discard workout, Skip section, Reset program.

### Empty states
Centered in the content zone: label-sm uppercase muted title, one body line ink-faint, optional secondary button. No illustrations, no icons above 22px.

---

## 3. Motion principles

- **Set to rest**: logged set content exits down 24px and fades (duration-screen, ease-exit); rest timer enters from opacity 0 and y plus 16px (duration-phase, ease-standard). The segmented bar animates its fill at the same moment: one visible cause and effect.
- **Rest to next set**: at 0:00 the rest numerals fade, next exercise card expands into the header position, new set screen enters like above. Skipping does the same, faster (duration-screen).
- **Within a set screen**: only three things may move: the timer digits, the linear progress fill, the effort selection state. Photo, name and inputs are static.
- **Breathing**: the shape's scale timing is exactly the configured inhale and exhale durations, ease-breath, no overshoot. Phase changes (breathing to retention to recovery) cross-fade over duration-phase. The retention stopwatch runs without any other motion on screen.
- **Counters** animate value changes by ticking through digits (tabular-nums prevents layout shift), never by sliding rows of numbers.
- **Never animates**: the tab bar, the week strip, borders, blur or colour of the photo treatment, and anything during retention except the stopwatch. No parallax, no springs with visible bounce, no looping ambient animation during workouts.
- Every animation is interruptible; user input always wins immediately.

---

## 4. Layout rules

- **Frame**: 390 by 844 design frame. Safe areas: respect `env(safe-area-inset-top)` (status zone about 59px) and `env(safe-area-inset-bottom)` (home indicator 34px). Nothing interactive inside the bottom 34px.
- **Gutter**: 24px horizontal everywhere. Full-bleed is reserved for the exercise photo and sheet scrims.
- **Bottom action zone**: primary actions live in the bottom 88px above the safe inset (58px button plus 14px padding plus hint line). In the player the effort selector is the bottom action. Minimum touch target 48px including padding; steppers reach it via padding.
- **Grid**: single column, stacked blocks, gap 14 to 16px between cards. Paired controls are flex rows with gap 8 to 10px, equal flex.
- **Hierarchy per screen**: exactly one Anton display element dominates (a timer or a title). Everything else is Archivo labels and meta. One amber element region per screen zone.
- **Exercise photo recipe (in-card)**: `object-fit: cover`, `filter: grayscale(1) contrast(1.1) brightness(0.92)`, radius-xs, 1px border-strong, on bg-surface.
- **Exercise photo recipe (full-screen, set screen)**: absolute inset cover, `object-position: center 30%`, `filter: grayscale(1) contrast(1.15) brightness(0.55)`, then scrim `linear-gradient(180deg, rgba(11,13,16,.72) 0%, rgba(11,13,16,.42) 26%, rgba(11,13,16,.66) 46%, rgba(11,13,16,.94) 64%, #0B0D10 78%)`. Content sits above the scrim; floating panels use bg-panel; display type over photo adds shadow-text-photo. The bottom third is always effectively solid bg-app, so contrast rules hold.
- Swap the two poses of an exercise photo on a 2 s interval during the set only, cross-fade duration-phase.

---

## 5. Screen inventory

Built in `Forge Directions.dc.html` section 2: **Home**, **Player Set**, **Player Rest**, **Breathing Retention**. The rest compose from the same parts (see also Player step variants, Resume banner and Confirmation dialogs in section 2):

- **Pre-session overview**: title block (label kicker, display-lg session name, meta), exercise list as day-summary cards (thumb, name, sets by reps, last weight), START SESSION primary pinned in bottom zone.
- **Session list sheet** (swipe down from the player): the current workout's structure, not the program. Grouped by section (label section name plus type kicker STANDARD / SUPERSET / CIRCUIT x4, ghost action `SKIP SECTION`). One row per block: thumb, display-xs name, then a set line where each set is a small cell (done: ink fill with `30 x 9` and effort dot; current: accent border; upcoming: line-strong border; skipped: ink-ghost strikethrough). Row actions on a trailing icon button opening an action row: `GO TO SET`, `EDIT SETS`, `SWAP`, `NOTES`, `REMOVE`. Sheet footer: secondary button `ADD EXERCISE`. Tapping a row's current set closes the sheet on that step.
- **Swap picker**: sheet, search field (stepper-panel styling), a first group `FROM YOUR PROGRAM` (block alternatives), then `SIMILAR` (auto suggestions filtered by available equipment), rows with photo thumb, name, target muscles and equipment meta. Selected row gets accent border. Confirm as primary button.
- **Add exercise picker**: same sheet as the swap picker over the full library with muscle and equipment filter chips, followed by a second step with three steppers (sets, reps target max, rest seconds) and a segmented target-type control, primary `ADD`.
- **Extra sessions** (from Home quick access): list of day-summary cards (name, meta duration and exercise count), each opening the pre-session overview.
- **End-of-session summary**: display-lg DONE header, three stat blocks in a row (duration, volume, sets) as bordered panels with Anton value size values, per-exercise list with effort dots and a success-coloured `+2.5 KG` meta where weight increased, then a note field (stepper-panel styling, multiline), then, only if the workout was modified, a bordered panel `YOU CHANGED THIS SESSION` listing each change (swap, added, removed, set count) with a toggle `Keep for future sessions` per row (accent when on, default on). Primary button `SAVE` pinned in the bottom zone.
- **Breathing setup**: bg-deep. Speed as a three-cell segmented control (SLOW / STANDARD / FAST, same geometry as the effort selector, breath colour when selected, meta line under it showing the resulting `3 s in · 3 s out`). Rounds (1 to 5) and breaths (20 to 40, step 5) steppers in breath accent. Collapsed panel `AUDIO AND FEEDBACK` with toggles: music, breathing phase music plus track picker, retention phase music plus track picker, breathing sounds, visual feedback, haptic feedback, ping and gong. Primary button `START` in breath colour with accent-ink text. Inhale and exhale seconds per preset are edited in Settings, not here.
- **Breathing summary**: average retention as the dominant Anton value, then retention time per round as horizontal bars (breath colour fill on line track), Anton values right-aligned and editable on tap (keypad sheet, mm:ss), trailing ghost delete per round, meta comparison line vs last session, note field, primary `SAVE`, ghost `RESTART` and `DISCARD`.
- **History, workouts**: list of day-summary cards grouped by week, each with date kicker, session name, meta volume line.
- **History, exercise chart**: exercise picker row (chip-style), then line chart: 1px breath-tinted grid, accent line, dot on last point, Anton value callout. Axis labels label-xs muted.
- **History, breathing chart**: bar chart of best retention per session, breath colour bars, track line-faint.
- **History, calendar**: month grid, each day reuses the week-strip ring states at 18px, month label display-xs.
- **Settings**: grouped bordered panels, rows with body text and value in ink-muted, toggles use accent when on. Sections in order: Account (Google avatar, name, ghost `SIGN OUT`), Program (name, start date, `IMPORT`, destructive `RESET`), Workout timers (seconds per rep, margin, default rest, default prep), Sounds and haptics (sounds, vibration, countdown beeps), Equipment available (multi-select chips, grey informational variant, accent when on), Breathing (inhale and exhale seconds per preset, recovery hold, default audio toggles), Units and language (kg fixed, English), About (font and exercise data credits).

Every screen keeps the rule set: one dominant Anton element, amber only where the user should look or act, breath blue replaces amber inside the Breathe tab, tab bar hidden during player and breathing sessions.
