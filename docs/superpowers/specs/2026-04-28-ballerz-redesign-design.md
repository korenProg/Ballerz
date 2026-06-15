# Ballerz Redesign — Design Spec
**Date:** 2026-04-28  
**Status:** Approved

---

## Overview

Full visual and functional redesign of the Ballerz app. Ballerz is a single-admin tool for managing a casual friend football league — recording game results, tracking players, and sharing stats. The redesign addresses two problems: the UI is too plain, and some features are too detailed for casual use (live per-player goal tracking, season badges).

**Approach:** Full rewrite of all screens in one pass (Option A). No incremental rollout — clean break ensures visual consistency.

---

## Design System (`constants/theme.ts`)

### Colors
| Token | Value | Usage |
|---|---|---|
| `background` | `#07080f` | All screen backgrounds |
| `surface` | `rgba(255,255,255,0.04)` | Card fills |
| `border` | `rgba(255,255,255,0.07)` | Card borders |
| `accent` | `#f59e0b` | CTA buttons, date badges, MVP labels only |
| `textPrimary` | `#ffffff` | Scores, headings |
| `textSecondary` | `#c8ccd8` | Team names, body |
| `textMuted` | `#3a3d52` | Labels, eyebrows |

No team-color glows or gradient bleeds on cards.

### Typography
- Font: system font (`-apple-system` / `SF Pro`)
- Hero scores: 28px weight 900
- Section headings: 20px weight 800
- Card labels: 9px weight 800, letter-spacing 2px, uppercase
- Body: 12–13px weight 700

### Radius tokens
- Cards: 22px
- Pills / stat chips: 14px
- Badges: 6–8px

### Components
- **GlassCard**: `background: surface`, `border: 1px solid border`, `borderRadius: 22px`, `backdropFilter: blur(12px)` (via `expo-blur` if needed)
- **AccentBadge**: amber background, black text, 6px radius
- **StatPill**: glass surface, centered value + label

### Libraries
- `expo-linear-gradient` — already installed, used for CTA button gradient
- No new UI libraries

---

## Screens

### Home Tab (`app/(tabs)/index.tsx`)

**Layout (top to bottom):**
1. Status bar
2. Header: `BALLERZ` logo (amber Z) + `+` icon button (navigates to `/create-game`)
3. Stats strip: three `StatPill` components — Games (blue), Players (purple), Goals (amber). Values derived from store.
4. "LAST RESULT" eyebrow + `GlassCard` showing: league label, FT badge, team names + score (28px), MVP `AccentBadge` + player name, location text
5. "UPCOMING" `GlassCard` (if next game exists): upcoming date badge (amber), team names
6. Amber gradient CTA button: `+ Create Game` → `/create-game`

**Guard:** `if (!hasOnboarded) return <Redirect href="/onboarding" />` (unchanged)

---

### Games Tab (`app/(tabs)/games.tsx`)

**Layout:**
- Header with `+` button → `/create-game`
- FlatList of game cards, newest first
- Each card (GlassCard): date, `HOME_TEAM score–score AWAY_TEAM`, MVP badge, location
- Upcoming games shown with an amber "UPCOMING" pill instead of a score

**Tap a completed game → Result Sheet (modal or stack screen):**
- Two large number inputs: Home goals / Away goals
- MVP picker: horizontal scroll of player avatar chips, tap to select
- Save → updates game in store (`updateGame`)
- If score already entered, sheet opens pre-filled (allows editing)

**No live tracker.** The `LiveTrackerModal` and all per-player goal state are removed.

---

### Players Tab (`app/(tabs)/players.tsx`)

**Layout:**
- Header with `+` button → `/create-player` (unchanged)
- FlatList of player cards (2-column grid)
- Each card: player photo (or initials avatar), name, position, OVR badge (amber)
- Tap → Player Detail screen (stack): name, photo, position, 6-stat grid (PAC/SHO/PAS/DRI/DEF/PHY), OVR + Edit button
- Edit button → opens the same `create-player` modal pre-filled with existing player data. Save calls `updatePlayer()` in store.

---

### Stats Tab (`app/(tabs)/stats.tsx`)

**Data source:** All values derived from Zustand store — no hardcoded data.

**Layout (three sections):**

**1. League Totals Strip**
Three `StatPill` values: Total Games, Total Goals (sum of all game scores), Most Common Venue (mode of `game.location`).

**2. Rivalry Card** (only shown when ≥2 games share the same two team names, matched case-insensitively in either order)
- Surfaces the most-played matchup
- Shows head-to-head record: `W / D / L` from home team's perspective
- Last result score
- "RIVALRY" eyebrow label

**3. Last Match Radar**
- Hexagon/spider chart with 6 axes: PAC, SHO, PAS, DRI, DEF, PHY
- Each axis value = average of that stat across all players in that team's lineup for the last game
- Two overlapping filled polygons, one per team, in their respective team colors with low opacity fill
- Implemented with `react-native-svg` (to be added as dependency)

If fewer than 1 game exists, Stats tab shows an empty state.

---

### League Tab (`app/(tabs)/league.tsx`)

No functional changes. Visual pass only — apply new design tokens (background, glass cards, amber accents).

---

## Data Model Changes

### Remove
- Any per-game per-player goal tracking fields (e.g., `goals` arrays on game players)
- `LiveTrackerModal` component and all associated state

### Add
- `updatePlayer(id, partial)` store action — merges updated fields into the existing player record
- `game.homeScore: number` and `game.awayScore: number` — recorded after the fact via Result Sheet
- `game.mvpPlayerId: string` — ID of the player selected as MVP
- `game.status: 'upcoming' | 'completed'` — derived: `completed` when `homeScore !== undefined`, `upcoming` otherwise. No explicit status field stored.

### Keep
- Player attributes: PAC, SHO, PAS, DRI, DEF, PHY (used for radar chart)
- `game.homeTeam`, `game.awayTeam`, `game.lineup`, `game.date`, `game.location`

---

## Navigation

No structural changes to the tab layout (5 tabs: Home, Games, Players, Stats, League).

New stack screen added: `app/record-result.tsx` — the Result Sheet, registered in `_layout.tsx` as a modal.

---

## Out of Scope

- Season badges / season concept (removed entirely)
- Per-player goal tallies
- Push notifications
- Multi-admin support
- Social sharing
