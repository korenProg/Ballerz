# Ballerz — Create Flows & League Setup Design

**Date:** 2026-04-26
**Status:** Approved

---

## Overview

Add league identity (onboarding + League tab) and extract player/game creation into dedicated screens. The app moves from a single-tab-does-everything model to a clean separation: list/view tabs + dedicated create screens.

---

## Navigation Structure

```
app/
  _layout.tsx          ← add onboarding route + modal + stack routes
  onboarding.tsx       ← NEW: first-launch wizard
  create-player.tsx    ← NEW: modal bottom sheet
  create-game.tsx      ← NEW: full-screen wizard (extracted from games.tsx)
  (tabs)/
    _layout.tsx        ← add League tab (5th tab)
    index.tsx          ← Home (no change)
    games.tsx          ← stripped of create logic, list/view only
    players.tsx        ← stripped of create logic, list/view only
    stats.tsx          ← no change
    league.tsx         ← NEW: profile card + editable settings
```

**Bottom tabs (5 total):** Home · Games · Players · Stats · League

---

## Store Changes

New `league` slice added to Zustand store alongside `players` and `games`:

```ts
type League = {
  name: string
  logoUri: string | null   // local file URI from image picker
  color: string            // hex, e.g. "#0039a3"
  defaultLocation: string
  defaultTeamSize: number  // 5, 7, or 11
  adminName: string
}
```

New top-level flag:

```ts
hasOnboarded: boolean   // persisted — controls whether onboarding shows on launch
```

**New actions:** `setLeague(updates: Partial<League>)`, `completeOnboarding()`

**Game type changes:**
- Remove `homeCaptain` and `awayCaptain` fields entirely
- Home team color defaults to `league.color`, away defaults to `#cc0000`

---

## Screen 1: Onboarding Wizard (`app/onboarding.tsx`)

Shown when `hasOnboarded === false`. Full-screen, no skip option. 3 steps with progress dots at the bottom.

**Step 1 — League Identity**
- League name: text input
- League logo: tap to open image picker (circular preview; optional — defaults to Ionicons `trophy` icon as placeholder)
- League color: row of 6 preset color swatches (gold, blue, red, green, purple, white)

**Step 2 — Details**
- Admin name: text input
- Default location: text input
- Default team size: pill selector — 5v5 / 7v7 / 11v11

**Step 3 — Done**
- Styled league profile card (logo, name, color banner)
- "Let's go" button → calls `completeOnboarding()`, navigates to Home tab

Back button available on steps 2 and 3.

---

## Screen 2: League Tab (`app/(tabs)/league.tsx`)

Two sections, no sub-navigation.

**Top — Profile Card**
- Color gradient banner using `league.color`
- Circular logo (60px), league name, admin name
- Total games played count (e.g. "24 games")
- Read-only display — edits happen below

**Bottom — Edit Form**
- Scrollable inline-editable rows: name, logo, color, location, team size, admin name
- "Save Changes" button → calls `setLeague()`, updates profile card immediately via store

---

## Screen 3: Create Player (`app/create-player.tsx`)

Opens as Expo Router modal (`presentation: 'modal'`). Scrollable bottom sheet style.

**Fields (in order):**
1. Photo — image picker, circular preview (defaults to `playerDefaultPic.png`)
2. Name — text input (required)
3. Position — pill selector: GK / DF / MF / FW
4. Preferred Foot — pill selector: L / R
5. Form — pill selector: 🔥 Hot / ➡️ Neutral / ❄️ Cold (defaults to Neutral)
6. Stats grid — 2-column number inputs: PAC · SHO · PAS · DRI · DEF · PHY (0–99)
7. OVR — read-only, auto-calculated as average of the 6 stats, displayed in gold

**Footer:** "Add Player" button — enabled only when name and at least one stat are filled. Calls `addPlayer()`, dismisses modal.

**Defaults:** goals, assists, mvps start at 0; `isMvp` starts false.

---

## Screen 4: Create Game Wizard (`app/create-game.tsx`)

Full-screen push screen. Header with back button. Logic extracted from `games.tsx`.

**Step 1 — Match Setup**
- Home team name — text input
- Home team color — defaults to `league.color`, optional color picker to change
- Away team name — text input
- Away team color — defaults to `#cc0000`, optional color picker to change
- Date — date picker, defaults to today
- Location — text input, pre-filled from `league.defaultLocation`

**Step 2 — Lineup**
- Two columns: Home and Away
- Player list from store — tap to assign to a side
- Team size limit from `league.defaultTeamSize` (shows "X/Y players" counter)
- Players assigned to one side are disabled on the other

**Step 3 — Confirm**
- Summary card: teams, colors, location, date, lineup counts
- "Create Game" button → calls `addGame()` with `status: "Pending"`, navigates back to Games tab

---

## Changes to Existing Screens

**`games.tsx`**
- Remove all create-game UI and state
- Add "Create Game" button that pushes to `create-game.tsx`
- Keep list/view/finish game logic as-is

**`players.tsx`**
- Remove all create-player UI and state
- Add "Add Player" button that opens `create-player.tsx` modal
- Keep list/view/delete/sort logic as-is

---

## Out of Scope

- Captain fields (removed from app entirely)
- Season management (season derived automatically from game count)
- Multi-league support
- Stats screen hardcoded data (separate task)
