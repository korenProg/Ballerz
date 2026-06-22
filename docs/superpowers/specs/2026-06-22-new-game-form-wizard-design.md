# New Game Form — Multi-Step Wizard Redesign

**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Scope:** Redesign `app/create-game.tsx` from a single long scroll into a 3-step wizard, without changing what gets saved.

## Goal

Turn the create/edit/log-result form into an onboarding-style multi-step wizard that's cleaner and more guided: **Home team → Away team → Match details (+ Result)**. Each team is grouped with its squad and shows a live crest preview. The data model and `save()` semantics are unchanged.

## Decisions (from brainstorming)

- **Multi-step wizard**, mirroring `onboarding.tsx` (segmented progress bar, per-step screens, Continue/Back footer).
- **Steps:** Step 1 Home team (+ home squad), Step 2 Away team (+ away squad), Step 3 Match details — date, location, Upcoming/Log-result mode, and (when logging) score + MVP.
- **Native date picker** via a new dependency `@react-native-community/datetimepicker`.
- **Live crest preview** at the top of each team step.
- **Architecture (Approach A):** single `create-game.tsx` owns all state + `save()`; step bodies and the crest are extracted into focused presentational components.

## Architecture

### Files

| File | Responsibility |
|---|---|
| `app/create-game.tsx` | Orchestrator + state owner. Holds all `useState`s, `step` (0/1/2), `save()`, `toggle()`, `snapshot()`, date conversion, picker state. Renders the active step + progress bar + footer. |
| `components/Crest.tsx` | Shared crest: logo image, else colored circle with `teamInitials`. Extracted from `GameScoreboard.tsx` and reused by it and the wizard preview. Props: `{ name: string; color: string; logo?: string; size: number }`. |
| `components/wizard/HomeStep.tsx` | Presentational home-team step body. |
| `components/wizard/AwayStep.tsx` | Presentational away-team step body. |
| `components/wizard/DetailsStep.tsx` | Presentational details + result step body. |

Step components are **pure UI** — no store access. They receive exactly the state and handlers they need as props. `create-game.tsx` remains the only place that touches the Zustand store.

### State (unchanged set, in `create-game.tsx`)

`homeTeam, awayTeam, homeColor, awayColor, date (DD/MM/YYYY string), location, homeLogo, awayLogo, homePlayerIds, awayPlayerIds, mode ("upcoming"|"result"), homeScore, awayScore, mvpId, mvpStat` — plus new: `step (0|1|2)` and `showDatePicker (boolean)`.

All initialized from `editing` when present (edit mode), exactly as today.

## Steps

### Step 1 — Home team / Step 2 — Away team

Both share the same layout (bound to home vs away state):

- Eyebrow `STEP 1 OF 3` / `STEP 2 OF 3`; title "Home team" / "Away team"; short sub.
- **Live crest preview** (centered, ~96px) using `Crest`: shows the picked logo, else a colored circle with the name's initials in the chosen color. Team name renders beneath (placeholder "Home"/"Away" when empty).
- **Name** text input.
- **Color row** — existing swatch row; drives the crest color and the lineup-chip highlight.
- **Logo slot** — tappable → `expo-image-picker` (existing `pickLogo`); shows picked image; a small control to clear it.
- **Squad picker** — roster as toggle chips for this side; selecting removes the player from the other side (existing `toggle`, mutual exclusion across steps). Empty roster → "No players yet — add players first" link to `/create-player`. Hint shows `league.defaultTeamSize` and a live "N selected" count.
- **Validation:** Continue disabled until this team's name is non-empty.

### Step 3 — Match details (+ Result)

`STEP 3 OF 3`, title "Match details".

- **Summary preview** (read-only) at the top: a compact matchup line (both crests + names, "vs" or the entered score) to confirm what's been built.
- **Mode toggle:** Upcoming / Log result segmented control.
- **Date:** tappable field showing a friendly formatted date (e.g. "Sat, 21 Jun 2026") → opens the native date picker. Stored internally as the `DD/MM/YYYY` string.
- **Location:** text input (prefilled from `league.defaultLocation`).
- **When mode = Log result:**
  - **Score:** two steppers `Home [n] : [m] Away`, each with the team's crest + name above its stepper.
  - **MVP (optional):** chips from the combined home+away lineup; selecting reveals the stat text field. Skippable.

Footer: Back · Save ("Create Game" / "Save Result").

## Navigation, progress & validation

- **Progress bar:** 3 segments (onboarding style); completed/current highlighted; tapping a previous segment jumps back (no forward skipping).
- **Footer:**
  - Step 1: **Continue** (disabled until home name set); no Back.
  - Step 2: **Back · Continue** (Continue disabled until away name set).
  - Step 3: **Back · Save**.
- **Header:** ✕ closes the whole form (`router.back()`); title "New Game" / "Edit Game".
- **Back semantics:** Back on steps 2–3 goes to the previous step; the header ✕ exits the screen.
- **Edit mode:** prefilled from `editing`, starts at Step 1; user can Continue through or jump via the progress bar.

## Data, date picker & edge cases

- **Save logic unchanged.** The existing `save()` keeps its branches: create vs edit; upcoming vs result; lineup snapshots `{id,name,position}`; `mvps` bumped exactly once on a fresh transition into FT with a chosen MVP; **edit never bumps**. The wizard only changes how fields are collected.
- **Date conversion:** keep `date` as `DD/MM/YYYY`. Add a `parseDMY(str): Date` helper (in `utils/game.ts`, alongside `formatDate`/`parseGameDate`) to feed the picker; convert the picker's `Date` back via `formatDate`. Default = today, or `editing.date`. An unparseable string falls back to today.
- **Date picker platform:** iOS inline/spinner, Android dialog (`mode="date"`); standard `onChange`, dismiss-safe (Android fires `dismissed`).
- **Edge cases:** empty roster → add-players link, lineups optional; a player can't be on both sides; MVP only choosable from a non-empty lineup; closing mid-wizard discards (no draft persistence — matches current behavior).

## Out of scope

- No draft auto-save across app launches.
- No change to the `Game` model, store actions, or any consumer of games.
- Players/League tabs untouched.

## Testing (manual — no test suite)

In the running app (Expo):
1. Create **Upcoming**: Home → Away → Details → Create; appears under UPCOMING.
2. Create **Log result**: walk through, set score + MVP; appears under RESULTS as FT; MVP's `mvps` +1 exactly once.
3. **Edit** an existing game: prefilled, jump via progress bar, save updates in place (no duplicate, no MVP re-bump).
4. **Empty roster:** add-players link shows; teams-only game still creates.
5. **Date picker:** pick a date on iOS and Android; stored/displayed correctly; cancel leaves it unchanged.
6. **Validation:** Continue disabled with empty team name on steps 1 & 2.
7. Live crest preview updates as name/color/logo change.
