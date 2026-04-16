# Ballerz — Data Layer & CRUD Design
**Date:** 2026-04-16
**Status:** Approved

---

## Overview

Replace all hardcoded static data arrays across the app with a single shared persistent store. Add full create/edit/delete flows for players and games. All four tabs read from the same source of truth.

---

## 1. Data Layer

### Storage & State Management
- **Zustand** for global state management
- **AsyncStorage** (`@react-native-async-storage/async-storage`) for persistence
- Zustand `persist` middleware wires storage automatically — no manual load/save code

### Store Shape (`store/index.ts`)
```ts
interface BallerzStore {
  // State
  players: Player[]
  games:   Game[]

  // Player mutations
  addPlayer:    (player: Omit<Player, 'id'>) => void
  updatePlayer: (id: string, updates: Partial<Player>) => void
  deletePlayer: (id: string) => void
  setMvp:       (playerId: string) => void  // marks isMvp=true, clears previous

  // Game mutations
  addGame:    (game: Omit<Game, 'id'>) => void
  updateGame: (id: string, updates: Partial<Game>) => void
  deleteGame: (id: string) => void
  finishGame: (id: string, homeScore: number, awayScore: number, mvpName: string, mvpStat: string) => void  // sets status → "FT", records score + MVP
}
```

- Persisted under AsyncStorage key `ballerz-store`
- Rehydrates automatically on app launch — no loading screen needed
- `types/players.ts` and `types/games.ts` remain unchanged

### Selectors (`store/selectors.ts`)
Thin derived-value hooks to avoid repeated logic across screens:
```ts
useLastGame()    // most recent FT game sorted by date
useMvpPlayer()   // players.find(p => p.isMvp)
useAppStats()    // { gamesCount, playersCount, totalGoals }
```

---

## 2. Navigation & Screen Structure

Forms open as full stack screens (push from right). Expo Router file structure:

```
app/
  (tabs)/
    index.tsx       ← reads from store (replaces hardcoded data)
    players.tsx     ← reads from store
    games.tsx       ← reads from store
    stats.tsx       ← reads from store
  player/
    add.tsx         ← Add Player form
    [id].tsx        ← Edit Player form (prefilled)
  game/
    add.tsx         ← Create Game wizard (2 steps)
    [id].tsx        ← Edit Game result/MVP (FT games only)
  _layout.tsx       ← adds Stack.Screen entries for player/* and game/*
```

**Navigation triggers:**
- Players `+` button → `router.push('/player/add')`
- Player row long-press → `router.push('/player/<id>')`
- Games `+` button → `router.push('/game/add')`
- Completed game tap → `router.push('/game/<id>')`

---

## 3. Add / Edit Player Form

**Route:** `app/player/add.tsx` and `app/player/[id].tsx` (same component, edit mode prefills fields)

**Layout:** Single scrolling screen

**Header:** Back button + title ("Add Player" / "Edit Player") + "Save" button (top-right)

**Fields (top to bottom):**
1. **Photo** — tappable circle, opens `expo-image-picker` from camera roll. Falls back to initials if no photo set.
2. **Name** — text input (required)
3. **Position** — pill selector: `GK | DF | MF | FW`
4. **Foot** — pill selector: `L | R`
5. **Form** — pill selector: `❄️ Cold | — Neutral | 🔥 Hot`
6. **Attributes** — 2-column grid of 6 number inputs: PAC, SHO, PAS, DRI, DEF, PHY (0–99). Colored by value using existing `attrColor` function (green ≥80, yellow ≥65, red below).
7. **OVR** — auto-calculated as `Math.round((pac+sho+pas+dri+def+phy) / 6)`. Tap a lock icon to unlock and type a manual override. Tapping lock again returns to auto-calculated mode.

**Validation:**
- Name is required — show inline error if empty on Save
- Stats default to 50 if left blank on Save

**Edit mode extras:**
- All fields prefilled from existing player data
- "Delete Player" button at the bottom (red, triggers confirm dialog before deleting)
- Save calls `updateStore.updatePlayer()`

**Add mode:**
- Save calls `store.addPlayer()` with a generated UUID as `id`
- Navigates back to Players tab on success

---

## 4. Create Game Wizard

**Route:** `app/game/add.tsx`

### Step 1 — Pick Players
- Scrollable list of all players from store, sorted by OVR descending
- Each row: avatar initials, name, position, OVR badge
- Tap to select/deselect — selected rows highlight with blue border + checkmark
- Counter badge shows "N selected"
- "Next →" button disabled until ≥ 2 players selected

### Step 2 — Setup + Teams

**Setup section:**
- Date picker (defaults to today)
- Time picker (defaults to current time rounded to nearest hour)
- Location text input (optional)

**Team names & colors:**
- Two text inputs for team names (defaults: "Team A" / "Team B")
- Each has a color dot — tap to pick from 6 preset colors: red, blue, green, yellow, purple, white

**Split method** (pill selector):
- **Random** — players shuffled randomly into two equal (or near-equal) groups
- **Balanced** — algorithm pairs players by OVR to produce two squads with matching average ratings
- **Manual** — two columns shown immediately; tap a player to move them between teams

**Team preview:**
- Shown below the method pills for all three methods
- Displays both squads with player names and team OVR average
- For Random and Balanced: user can still tap any player to move them to the other team
- For Manual: the preview IS the assignment interface

**Create Game button:**
- Saves game to store with `status: "Pending"`
- Navigates back to Games tab on success

---

## 5. Edit Game Screen

**Route:** `app/game/[id].tsx` — only accessible for `FT` games (tapping a completed game card)

- Displays current score and MVP
- Allows editing home/away score (number inputs)
- "Change MVP" button opens existing `MvpPickerSheet` component
- Save calls `store.updateGame()`

---

## 6. Updating Existing Screens

### What changes in every tab:
- Delete hardcoded `initialPlayers`, `initialGames`, `PLAYERS`, `GAMES` arrays
- Replace local `useState(initialData)` with `const { players, games } = useStore()`
- Replace local mutation calls with store actions

### Home screen (`index.tsx`):
- `lastGame` → `useLastGame()` selector
- `lastMVP` → `useMvpPlayer()` selector
- `appStats` (games count, players count, goals) → `useAppStats()` selector

### Stats screen (`stats.tsx`):
- Has its own hardcoded copies of both arrays — deleted
- All computed stats (leaderboard, win rates, rivalries, dream team) already derive from data; they work as-is once real data flows in

### Players screen (`players.tsx`):
- `players` state → `useStore().players`
- Mutations (`setPlayers`) → `store.deletePlayer(id)`, `store.setMvp(id)`

### Games screen (`games.tsx`):
- `games` state → `useStore().games`
- Mutations → `store.updateGame()`, `store.deleteGame()`, `store.finishGame()`

---

## 7. New Dependencies

| Package | Purpose |
|---|---|
| `zustand` | Global state management |
| `@react-native-async-storage/async-storage` | Persistence adapter for Zustand persist middleware |
| `expo-image-picker` | Camera roll photo selection for player photos |

`expo-image-picker` is part of the Expo ecosystem and works without a custom dev build.

---

## 8. Files Added / Modified

**New files:**
- `store/index.ts` — Zustand store
- `store/selectors.ts` — derived value hooks
- `app/player/add.tsx` — Add Player form
- `app/player/[id].tsx` — Edit Player form
- `app/game/add.tsx` — Create Game wizard
- `app/game/[id].tsx` — Edit Game result

**Modified files:**
- `app/_layout.tsx` — add Stack.Screen entries
- `app/(tabs)/index.tsx` — replace hardcoded data with store
- `app/(tabs)/players.tsx` — replace hardcoded data with store
- `app/(tabs)/games.tsx` — replace hardcoded data with store
- `app/(tabs)/stats.tsx` — replace hardcoded data with store
- `types/players.ts` — add optional `photo?: string` field
