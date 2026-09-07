# Arms, Neck & Core Specialisation, 10 weeks. Notes for Arnaud

Companion to `forge-program-arms-neck-core-2026q4.json` (schemaVersion 1).

## Structure

| Weeks | Phase | What changes |
|---|---|---|
| 1-4 | Accumulation | Baseline volume. Learn the sessions, let the app's double progression drive the loads. Neck: Thibarmy Intermediate. |
| 5-8 | Intensification | `overrides`: +1 set on deadlift, OHP, EZ-bar curl, leg press, assisted chin-ups; overhead DB triceps 3 sets. Neck: Thibarmy Advanced (4x15 / 4x12 and 4x10 / 5x5). Add the 7 kg vest on Monday pull-ups once you hit 10 clean reps. |
| 9 | Deload | Roughly half the sets everywhere, same loads. |
| 10 | Tests | Monday = test session (deadlift 3RM, pull-up max with and without vest, 90 s farmer hold). Other days at week 1 volume. |

Sessions: Mon `home-pull-grip`, Tue `office-full-body-a`, Wed `home-shoulders-arms`, Thu `office-full-body-b`, Fri `home-arms`. Library (never scheduled): `mobility-15`, `rower-zone2`, `heavy-bag`.

Estimated durations with the app's default timer rule (4 s/rep + 15 s) come out 10 to 15 min higher than reality because isolation sets are confirmed early and the remainder becomes bonus rest. Realistic: home sessions 55-60 min in weeks 1-4, 60-65 in weeks 5-8; office sessions 50-55 min. If a home day is tight, drop the rice bucket circuit first, then the warm-up circuit items you do not need.

## Rules that the JSON cannot express

1. **Tired-day rule.** If you arrive tired, reduce the load on deadlift, OHP and the neck bridges by 10-20 percent instead of skipping. The mid-back and neck pinches happen on fatigued sets, never on lighter ones. Do banded neck work instead of bridges if the neck already feels tight.
2. **Elbow rule.** Reverse curls, wrist extensions and Zottman curls are the first things to cut if the outside of the elbow becomes painful. Hammer curls and skull crushers are next. Never push through elbow pain during a specialisation block; it costs weeks.
3. **Neck progression** (Thibarmy): when the prescribed volume is completed without reaching near-failure two sessions in a row, move up a band (or increase band stretch), add weight on shrugs, and progress the bridges by arm position (hands on bench, then overhead, then across chest, then at sides).
4. **Pull-ups Monday** are sub-maximal on purpose: 5 x 3-4 at a level where you could do 7-8. Never take them to failure. The Thursday assisted chin-ups are the hypertrophy stimulus.
5. **Assisted movements** (chin-ups, dips at the office): the logged weight is the counterweight. Progress = lower the counterweight while staying in the rep range.
6. **Heavy bag** is free: any day, any time, but not right after a neck session.
7. **Nutrition:** maintenance or a very slight surplus for the whole block. No deficit until week 11.

## Starting loads

Only the deadlift has a planned weight (100 kg for 3-5, a conservative RPE 7 start). Everything else is blank on purpose: the first occurrence has no chip (PROG-7), you type the weight, and from the second occurrence the recommendation logic takes over. Aim for the bottom of each rep range at Ideal effort on week 1.

## PRD adaptations this file relies on (to confirm on the app side)

- **Overrides on `repeat` ranges.** The schedule uses `"repeat": "5-8"` together with `overrides`. The importer must apply the overrides to every week in the range, not only the first.
- **`assisted: true` on a block** (new optional field). Meaning: the weight is a counterweight, so PROG-2 should recommend "decrease counterweight" instead of "increase weight", and PROG-3/4 wording should flip accordingly. Used on the Thursday chin-ups and dips. If not implemented, the app's chip will be wrong on those two blocks; the notes tell you what to do.
- **Warm-up ramp sets** are written as single `reps` sets with `restSeconds: 0` inside a warm-up circuit and a note saying they are not logged. If the player insists on logging them, log weight 0.
- **Duration sets for tests.** The 90 s farmer hold uses a `duration` set. A `maxDuration` set type (stopwatch until failure, logs seconds) would be a better fit for tests and dead hangs; worth adding to the backlog.
- **Custom exercises** (16) have no images: neck exercises, rice bucket moves, suitcase carry, hollow hold, thoracic mobility, leg swings, heavy bag round. The generic placeholder applies (LIB-3).
- **Unilateral blocks** are flagged with `unilateral: true` (Gittleson shrug, Pallof press, side bridge, suitcase carry, cable wood chop). If SES-4 is not built in v1, the fallback of splitting them into left and right blocks applies.
- **Suggested timer settings** for this program: 3 s per rep and 5 to 10 s margin. The default 4 s / 15 s makes isolation sets far too long and inflates the estimated durations.

## Exercise id mapping worth knowing

A few free-exercise-db ids are used for a slightly different execution than the library name suggests; the block notes cover it: `Leverage_Iso_Row` = EGYM seated row, `Wide-Grip_Lat_Pulldown` = EGYM lat pulldown with a medium grip, `Seated_Leg_Curl` = EGYM leg curl, `Hyperextensions_Back_Extensions` = EGYM back extension, `Clean_Shrug` = hang power shrug, `Spider_Curl` = dumbbell spider curl on the incline bench, `Reverse_Barbell_Curl` = EZ-bar reverse curl, `Farmers_Walk` = kettlebell farmer carry, `Side_Bridge` = side plank.
