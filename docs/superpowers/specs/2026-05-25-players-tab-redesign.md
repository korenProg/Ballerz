# Players Tab Redesign

**Date:** 2026-05-25  
**Status:** Approved

## Overview

Upgrade the Players tab with three improvements: richer list rows showing top-3 attribute pills, a grid/list view toggle, and dynamic position filter tabs. Goals and assists are removed from all display since they cannot be auto-tracked from game results.

## Features

### 1. Richer List Rows

Replace the current minimal row sub-text with a third line showing the player's top 3 attributes as colored pills.

**Row layout (top to bottom):**
- Line 1: Player name + form badge + MVP pill (unchanged)
- Line 2: `{position} · {mvps} MVPs` — goals and assists removed
- Line 3: Three attribute pills showing the player's 3 highest attribute values

**Attribute pill styling:**
- `value >= 80` → green (`#4cde80`)
- `value >= 65` → amber (`#f5c518`)
- `value < 65` → red (`#e05555`)
- Background: same color at `~8%` opacity, border-radius 4, font-size 9, font-weight 700
- Format: `"PAC 88"`, `"SHO 85"`, etc.

**Top-3 selection:** Sort all 6 attributes (pac/sho/pas/dri/def/phy) by value descending, take the top 3. No position-specific logic.

### 2. Grid / List Toggle

A two-segment toggle button lives in the top-right of the TopBar, to the left of the `+` add button. 

- Left segment: grid icon (`▦`) — activates grid view
- Right segment: list icon (`☰`) — activates list view (default)
- Active segment has a slightly brighter background (`rgba(255,255,255,0.18)`) vs inactive (`rgba(255,255,255,0.06)`)
- Default view on mount: **list**
- State is local to the screen (no persistence needed)

**Grid view layout:**
- 3-column grid with `gap: 8` and `paddingHorizontal: 16`
- Each mini card: tier gradient background (reuse `TIER_GRADIENT`), border with tier color at 20% opacity, `borderRadius: 12`
- Mini card contents (top to bottom, centered):
  - Player photo or initials avatar (36×36, same tier color border)
  - OVR number (tier color, font-size 18, weight 900)
  - Last name in caps (white, font-size 9, weight 800) — use last word of `player.name`
  - Position (muted, font-size 8)
  - Form badge (flame/snowflake icon, font-size 9) — only if not neutral
- Tapping a mini card opens the existing `PlayerCardModal`

**List view:** Same as current rows but with the richer layout described in Feature 1.

**When view toggles:** Dismiss any open sort/menu dropdowns. Search and sort state persist across toggle.

### 3. Dynamic Position Filter Tabs

A horizontal scrollable pill row sits between the TopBar and the search bar.

- **"ALL"** tab always present, shows total player count: `ALL · {n}`
- Additional tabs: one per unique `player.position` value that exists in the roster, sorted alphabetically, showing count: `{POS} · {n}`
- Active tab: amber background (`T.accent`), black text
- Inactive tab: `T.surface` background, `T.border` border, muted text
- Filter applies on top of existing search text — both filters are additive
- When a position tab is selected and the user searches, only matching players from that position show
- Switching tabs resets scroll position to top

**Tab bar placement:** Below TopBar, above search+sort row. Always visible regardless of view mode.

### 4. Removed: Goals & Assists Display

Remove `{player.goals}G · {player.assists}A` from:
- `PlayerRow` sub-text
- `MvpCard` sub-text
- `CardBack` career stats section (remove Goals and Assists cells, keep MVPs)

The `goals` and `assists` fields remain on the `Player` type and in the store — they are just not displayed.

## What Stays Unchanged

- `TopBar` component and title
- Search bar with collapsing-on-scroll behavior
- Sort dropdown (OVR desc/asc, goals, MVPs) — sort options unchanged even though goals/assists aren't displayed
- Summary pills (player count, avg OVR)
- MVP card at top of list (dismissible, hidden during search)
- Select mode (long-press to enter, bulk delete)
- `PlayerCardModal` flip card — front unchanged; back removes goals/assists from career stats
- Empty state card
- `ConfirmDialog` for delete

## Files to Change

- `app/(tabs)/players.tsx` — all changes are contained here

## Out of Scope

- Persisting grid/list preference across app restarts
- Editing goals/assists manually (separate feature)
- Player profile screen (separate feature)
