# Game Card Redesign — Implementation Report

## Tasks Implemented

### Task A: Add team logo fields to Game model
**File:** `types/games.ts`
- Added `homeLogo?: string;` and `awayLogo?: string;` after `awayColor` field.

**Lint output:**
```
✖ 1 problem (1 error, 0 warnings)
  app/onboarding.tsx:159:43  error  react/no-unescaped-entities  [PRE-EXISTING, not introduced by this task]
```
No new errors.

**Commit:** `1711ca6` — `feat: add optional homeLogo/awayLogo to Game model`

---

### Task 3 (REVISED): GameScoreboard with crests + full card design
**Files created:**
- `components/GameScoreboard.tsx` — new shared component with `Crest` sub-component (image fallback to colored-initials badge), header row (location/league + date) shown only in `size="full"`, score/vs + status pill, team names, MVP row shown only in `size="full"`.
- `utils/game.ts` — also created here because `GameScoreboard` imports `teamInitials` from it and the file did not yet exist. Contains `formatDate`, `parseGameDate`, `teamInitials` (the full Task 1 content per the plan).

**Note:** `utils/game.ts` was required as a dependency of `GameScoreboard.tsx`. It was created as part of this commit to satisfy the import. Task 1 (when implemented later) will update `app/(tabs)/index.tsx` to import from this file instead of using its local copies.

**Lint output:**
```
✖ 1 problem (1 error, 0 warnings)
  app/onboarding.tsx:159:43  error  react/no-unescaped-entities  [PRE-EXISTING]
```
No new errors.

**Commit:** `7c947a9` — `feat: GameScoreboard with crest images + full card design`

---

### Task 14: Apply redesigned card to home LastGameCard
**File:** `app/(tabs)/index.tsx`
- Added import: `import GameScoreboard from "../../components/GameScoreboard";`
- Replaced `LastGameCard` body (bespoke header + `gameCardMiddle` markup, ~40 lines) with `<GameScoreboard game={game} size="full" />` inside the existing `gameCard` container `<View>` with the football watermark `<Ionicons>`.
- Removed local `teamInitials` function (now unused, would have caused a lint error if left).
- Kept `gameCard` and `cardWatermark` styles. Left other now-unused style keys (`gameCardHeader`, `gameCardLocation`, `gameCardSub`, `gameCardMiddle`, `teamCol`, `centerCol`, `teamBadge`, `teamBadgeTxt`, `gameScore`, `statusPill`, `liveDot`, `statusTxt`) in place per the plan's instruction.

**Lint output:**
```
✖ 1 problem (1 error, 0 warnings)
  app/onboarding.tsx:159:43  error  react/no-unescaped-entities  [PRE-EXISTING]
```
No new errors.

**Commit:** `11d8b59` — `feat: home last-game card uses redesigned GameScoreboard`

---

## Concerns

1. **Pre-existing lint error in `onboarding.tsx`** — `react/no-unescaped-entities` at line 159 (`Who's`). This was present before any of these changes and is not introduced by this work. It will need to be fixed separately (replace `'` with `&apos;` or a template literal).

2. **`utils/game.ts` created ahead of Task 1** — The plan sequences Task 1 before Task 3, but this agent was asked to implement Tasks A, 3 REVISED, and 14 only. Since `GameScoreboard` hard-imports `teamInitials` from `../utils/game`, the file had to exist for lint to pass. The file contains the exact content specified in Task 1 Step 1. When Task 1 is implemented later, Step 2 (updating `index.tsx` imports) will still need to happen — the local `formatDate` and `parseGameDate` in `index.tsx` are still present and can be replaced with the util imports at that time.

3. **Unused styles in `index.tsx`** — Per plan instructions, `gameCardHeader`, `gameCardLocation`, `gameCardSub`, `gameCardMiddle` etc. were left in place. ESLint does not flag unused StyleSheet keys, so this causes no lint errors.
