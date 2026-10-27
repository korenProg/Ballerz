# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (opens QR code for Expo Go)
npm run android    # Start with Android emulator
npm run ios        # Start with iOS simulator
npm run web        # Start web build
npm run lint       # Run ESLint via expo lint
npm run check      # Node built-in tests for utils/ (rating bands, next match, rivalries, player stats)
```

`npx tsc --noEmit` typechecks (not wired to an npm script). `npm run check` runs
Node's built-in test runner over the pure logic in `utils/` (rating bands, next
match, rivalries, player stats). There is no UI test suite, so lint + typecheck + check + a
successful Metro bundle is the automated safety net — none of which catch
runtime gesture or animation regressions. See the `running-ballerz` skill for the full verification recipe
and the Windows Metro traps.

## Project skills

`.claude/skills/` holds the detail that used to live here:

- `running-ballerz` — dev server, verification, Windows `EBUSY`/stale-Metro, `expo login`
- `using-the-ballerz-store` — store actions, selector stability traps, dates
- `building-ballerz-screens` — route registration, `T` palette, React Compiler ref rules
- `vercel-react-native-skills`, `animate-expo` — third-party RN/Expo rules (vendored)

## Architecture

**Ballerz** is a React Native app (Expo SDK 57, RN 0.86, file-based routing via expo-router) for managing amateur football leagues. It targets iOS, Android, and web from a single codebase.

### Routing structure

```
app/
  _layout.tsx          # Root Stack: (tabs) + onboarding, create-player, create-game, record-result, game/[id], player/[id]
  onboarding.tsx       # First-launch 3-step wizard; redirects to (tabs) on completion
  create-player.tsx    # Full-screen (headerShown: false)
  create-game.tsx      # Full-screen (headerShown: false)
  record-result.tsx    # Modal (presentation: "modal")
  game/[id].tsx        # Dynamic route: single-game detail / live controls
  player/[id].tsx      # Dynamic route: player detail
  (tabs)/
    _layout.tsx        # Bottom tab bar (Home, Games, Players, League)
    index.tsx          # Home dashboard
    games.tsx
    players.tsx
    league.tsx
```

Every non-tab screen is registered as a `Stack.Screen` in `app/_layout.tsx` with `headerShown: false`; only `record-result` uses `presentation: "modal"`. The root layout redirects to `/onboarding` when `hasOnboarded` is false (checked in `HomeScreen` via a `<Redirect>`, `app/(tabs)/index.tsx`).

**Implementation status:** every screen is built. The tab bar is a custom
`FloatingTabBar` with an animated pill (`(tabs)/_layout.tsx`), not the default
tab bar.

### State management

All app state lives in a single **Zustand** store (`store/index.ts`) persisted to **AsyncStorage** under the key `"ballerz-store"`. The three root slices are:

- `players: Player[]` — roster with per-player FIFA-style attributes (pac/sho/pas/dri/def/phy)
- `games: Game[]` — match history; status is `"Pending" | "Live" | "FT"`
- `league: League` — singleton config (name, color, logo, admin, defaults)
- `hasOnboarded: boolean`

All writes go through named store actions (`addPlayer`, `updatePlayer`, `deletePlayer`, `setMvp`, `addGame`, `updateGame`, `deleteGame`, `finishGame`, `setLeague`, `completeOnboarding`, `resetAll`) — never mutate slices directly. New entities get an id from the local `genId()` helper. `setMvp` is exclusive (clears `isMvp` on all other players); `finishGame` is the canonical way to move a game to `"FT"` with score + MVP.

Derived/memoized reads that span multiple slices live in `store/selectors.ts`
(`useLastGame`, `useMvpPlayer`, `useAppStats`, `usePlayerRivalries`, `useTeamOfLeague`, `useLastGameRadar`,
`useGamesByStatus`, `useNextGame`, `usePlayersByPosition`). Use selectors for anything that requires filtering or
aggregation. Aggregations only count games with `status === "FT"`.

**A selector that builds a fresh array or object every call renders forever**
("Maximum update depth exceeded"), and `useShallow` does not save you — it
compares one level deep, so a fresh array inside the returned object is still a
new reference. `useShallow` is only for a flat object of primitives
(`useAppStats`). For anything containing arrays or objects, select the stable
slice and derive with `useMemo` (`useGamesByStatus`, `useLastGameRadar`). The
`using-the-ballerz-store` skill has the before/after.

### Design system

FotMob-style, dark only. Spec: `docs/superpowers/specs/2026-10-13-fotmob-redesign-design.md`.

`constants/theme.ts` exports:

| Export | Contents |
|---|---|
| `T` | `bg #000000`, `surface #1A1A1A`, `surfaceAlt #262626`, `divider #2B2B2B`, `text #F2F2F2`, `textDim #A3A3A3`, `textFaint #8A8A8A`, `accent #2FD47A`, `red #F04438`, `yellow #F5C518` |
| `TYPE` | `screenTitle`, `sectionTitle`, `rowPrimary`, `rowSecondary`, `caption`, `score` text styles |
| `SPACE` / `RADIUS` | 4-pt spacing scale; `card 16`, `control 12`, `badge 8` |

Rules: cards have no border; weights 400–700 only; every number uses
`fontVariant: ["tabular-nums"]`; the league colour appears on crests only; the
green accent is for active state, live and primary actions — use it sparingly.

Build screens from `components/ui/`: `ScreenHeader`, `IconButton`, `Section`,
`ListRow`, `Tabs`, `RatingBadge`, `StatCompare`, `Button`, `EmptyState`.
`components/Crest.tsx` renders team crests and (`variant="avatar"`) neutral
player avatars. `GameCard` is a compact match row; `GameScoreboard` is the
card-less match header. `Colors`/`Fonts` in `theme.ts` are Expo template
leftovers — don't use them.

The font is Helvetica (`FONT` in `theme.ts`): import `Text`/`TextInput` from
`components/ui/Text`, never from `react-native` — lint rejects the latter.

Styling is `StyleSheet.create` per file. Pure logic that screens need lives in
import-free files under `utils/` so `npm run check` can test it with Node.

### Player attributes

`ovr` is always computed via `utils/ovr.ts:calculateOvr` (average of pac/sho/pas/dri/def/phy). Never persist a manually set OVR; always recompute when attributes change.

### Key conventions

- `expo-router` navigation uses typed routes (`experiments.typedRoutes: true` in app.json) — use `router.push("/route")` with string literals.
- `@/` path alias maps to the project root (configured in tsconfig).
- The React Compiler is enabled (`experiments.reactCompiler: true`); avoid manual
  `useMemo`/`useCallback` unless there's a specific reason. `store/selectors.ts` is
  that reason — there the memo is load-bearing for referential stability, not an
  optimization. The compiler also forbids reading or writing a ref during render;
  `eslint-plugin-react-hooks` v7 enforces it as `react-hooks/refs`.
- **Dates are `DD/MM/YYYY` strings.** Sort and compare with `parseGameDate` from
  `utils/game.ts`, never `new Date(g.date)` — JS reads that as `MM/DD/YYYY` and
  returns `Invalid Date` for any day past the 12th.
- Images (player photos, league logos) are stored as local `file://` URIs via `expo-image-picker`, not uploaded anywhere.
- Shared types live in `types/` and are re-exported through the `types/index.ts` barrel (`Player`, `Game`, `GamePlayer`, `League`, `ExportMode`). A game's MVP is the embedded `mvp: { name, stat }` object on `Game`; a player's `isMvp` flag (toggled by `setMvp`) is the separate "current MVP of the league" concept.
