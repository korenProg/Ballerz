# Games Tab — Task List Report

## Task 2: `useGamesByStatus` selector

**File modified:** `store/selectors.ts`

**Changes:**
- Added imports at top: `import type { Game } from "../types/games"` and `import { parseGameDate } from "../utils/game"`
- Appended `useGamesByStatus` selector (17 lines) that partitions `s.games` into `live`, `upcoming`, `results` with appropriate sort orders

**Lint output:** 1 error — pre-existing `react/no-unescaped-entities` in `app/onboarding.tsx`. No new errors.

**Commit:** `e4f03da`  feat: add useGamesByStatus selector

---

## Task 4: Games list screen

**File modified:** `app/(tabs)/games.tsx` (full replacement of stub)

**Changes:**
- Full replacement: `Section` component, `GamesScreen` with header bar, empty state (football icon + CTA), and scrollable live/upcoming/results sections
- Imports: `ScrollView`, `TouchableOpacity`, `Ionicons`, `useSafeAreaInsets`, `useStore`, `useGamesByStatus`, `GameScoreboard`, `T`, `Game`

**Lint output:** 1 error — pre-existing `app/onboarding.tsx`. No new errors.

**Commit:** `1c3d6da`  feat: games list screen with live/upcoming/results sections and empty state

---

## Task 5: Swipe-to-delete + GestureHandlerRootView

**Files modified:**
- `app/_layout.tsx` — added `GestureHandlerRootView` import and wrapped existing `<ThemeProvider>` tree
- `app/(tabs)/games.tsx` — added `Alert` and `Swipeable` imports; updated `Section` to accept `onDelete` prop and wrap rows in `Swipeable` with red trash action; added `deleteGame` + `confirmDelete` to `GamesScreen`; passed `onDelete={confirmDelete}` to all three `Section` usages; added `deleteAction` style

**Lint output:** 1 error — pre-existing `app/onboarding.tsx`. No new errors.

**Commit:** `7ab27fc`  feat: swipe-to-delete games + GestureHandlerRootView at root

---

## Summary

All three tasks implemented and committed. Lint is clean of new errors across all three runs (only the pre-existing `onboarding.tsx` error on line 159). No concerns.
