# Dark Unification — UI/UX Design Spec

**Date:** 2026-04-30  
**Direction:** Premium Dark Sports (FotMob / FIFA Ultimate Team aesthetic)  
**Scope:** All 5 tabs + global polish

---

## Goal

The app currently has a split personality: a deep-space dark hero on Home that transitions into a jarring white bottom sheet. Every other tab is already dark. This spec unifies everything into one cohesive dark system, adds consistent micro-interactions, and improves empty states across the board.

---

## Design Tokens (unchanged)

All changes use existing tokens from `constants/theme.ts`:

| Token | Value | Use |
|---|---|---|
| `T.bg` | `#07080f` | Sheet/screen backgrounds |
| `T.surface` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `T.border` | `rgba(255,255,255,0.07)` | Card/row borders |
| `T.accent` | `#f59e0b` | CTAs, active states, amber highlights |
| `T.textPrimary` | `#ffffff` | Headings, scores, names |
| `T.textSecondary` | `#c8ccd8` | Body text, team names |
| `T.textMuted` | `#3a3d52` | Labels, dates, dividers |

No new tokens introduced.

---

## Screen-by-Screen Changes

### 1. Home Tab (`app/(tabs)/index.tsx` + `components/Leaderboard.tsx`)

**Highest impact change in the entire spec.**

#### Bottom sheet
- `backgroundColor`: `#fff` → `T.bg`
- Add `borderTopWidth: 1, borderTopColor: T.border` to the sheet
- `paddingTop` stays at `20`

#### Section labels inside sheet
- `sectionTitle` color: `#aaa` → `T.textMuted`
- `sectionLink` color: `#f59e0b` (unchanged)

#### Recent game cards (`GameCard` component in index.tsx)
| Property | Before | After |
|---|---|---|
| `gameCard` background | `#f5f5f7` | `T.surface` |
| `gameCard` border | `#e5e5e5` | `T.border` |
| `ftPill` background | `#e5e5e5` | `rgba(255,255,255,0.06)` |
| `ftTxt` color | `#999` | `T.textMuted` |
| `gameDate` color | `#999` | `T.textMuted` |
| `gameTeamName` color | `#444` | `T.textSecondary` |
| `gameScore` color | `#111` | `T.textPrimary` |
| `gameScoreSep` color | `#bbb` | `T.textMuted` |
| `gameLocationTxt` color | `#999` | `T.textMuted` |

#### Empty state
- Wrap in a `T.surface` card with `T.border` border, `border-radius: T.radius.card`
- Keep amber gradient CTA button
- `emptyText` color: `#999` → `T.textSecondary`

#### `Leaderboard.tsx` — full dark reskin
| Property | Before | After |
|---|---|---|
| `container` background | `#f5f5f7` | `T.surface` |
| `container` border | `#e5e5e5` | `T.border` |
| `header` border | `#e5e5e5` | `T.border` |
| `hTxt` color | `#aaa` | `T.textMuted` |
| `row` border | `#e5e5e5` | `rgba(255,255,255,0.05)` |
| `pos` color | `#bbb` | `T.textMuted` |
| `avatar` background | `#e5e5e5` | `rgba(255,255,255,0.06)` |
| `avatar` border | `#ddd` | `T.border` |
| `avatarTxt` color | `#666` | `T.textSecondary` |
| `nameText` color | `#111` | `T.textPrimary` |
| `statVal` color | `#aaa` | `T.textMuted` |

OVR badge colors (amber/blue) are unchanged.

---

### 2. Games Tab (`app/(tabs)/games.tsx`)

Already uses `T` tokens throughout. Minor polish only.

- **Filter tabs**: reduce height from `48` → `44`, add `borderBottomWidth: 1, borderBottomColor: T.border` below the filter bar
- **Game cards**: add `activeOpacity={0.75}` to the card `TouchableOpacity`
- **"Edit result" CTA row**: change `color: T.accent` text to also have `textDecorationLine: "underline"` for better affordance
- **Empty state**: replace bare icon+text with a `T.surface` card matching the style used across other tabs

---

### 3. Players Tab (`app/(tabs)/players.tsx`)

Already dark. Micro-polish only.

- **Player rows**: add `activeOpacity={0.75}` (currently missing)
- **Summary pills**: add `borderLeftWidth: 2, borderLeftColor: T.accent` to the OVR average pill only for a subtle accent
- **Empty state** (if no players): `T.surface` card, amber CTA button, consistent with other tabs

---

### 4. Stats Tab (`app/(tabs)/stats.tsx`)

Already dark. Layout improvements.

- **Total strip**: give each stat a distinct accent color inline:
  - Games count: `#60a5fa` (blue) — already done ✓
  - Total Goals: `T.accent` (amber) — already done ✓
  - Avg/Game: `#a78bfa` (purple) — already done ✓
  - No change needed to values, just verify consistency
- **Section eyebrows** (RIVALRY, LAST MATCH COMPARISON): add `borderLeftWidth: 2, borderLeftColor: T.accent, paddingLeft: 6` for visual anchoring
- **Empty state**: replace bare icon+text with a `T.surface` card

---

### 5. Tab Bar (`app/(tabs)/_layout.tsx`)

- Add `tabBarStyle` to `screenOptions`:
  ```
  tabBarStyle: { backgroundColor: T.bg, borderTopColor: T.border }
  tabBarActiveTintColor: T.accent
  tabBarInactiveTintColor: T.textMuted
  ```
- This makes the tab bar blend into the dark background instead of floating as a separate light element

---

### 6. Global Micro-interactions

- All `TouchableOpacity` wrapping cards get `activeOpacity={0.75}` (currently inconsistent — some are 0.7, some 1, some missing)
- No new Animated wrappers needed — `activeOpacity` alone gives sufficient press feedback without added complexity

---

## Implementation Order

1. **Tab bar** — `_layout.tsx` (2 lines, instant visual win across all tabs)
2. **Leaderboard** — `Leaderboard.tsx` (token swap, no logic change)
3. **Home sheet + game cards** — `index.tsx` (token swap)
4. **Games polish** — filter bar separator, activeOpacity, empty state
5. **Players polish** — activeOpacity, summary pill accent, empty state
6. **Stats polish** — eyebrow borders, empty state

---

## Out of Scope

- No new data, screens, or navigation changes
- No new animation libraries (no Reanimated sequences, no LayoutAnimation)
- No changes to the `create-player`, `create-game`, `record-result`, or `onboarding` screens
- No changes to the FIFA card modal in Players
