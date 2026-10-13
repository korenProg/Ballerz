# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (opens QR code for Expo Go)
npm run android    # Start with Android emulator
npm run ios        # Start with iOS simulator
npm run web        # Start web build
npm run lint       # Run ESLint via expo lint
```

`npx tsc --noEmit` typechecks (not wired to an npm script). No test suite is
configured, so lint + typecheck + a successful Metro bundle is the whole
automated safety net — none of which catch runtime gesture or animation
regressions. See the `running-ballerz` skill for the full verification recipe
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
  _layout.tsx          # Root Stack: (tabs) + onboarding, create-player, create-game, record-result, game/[id]
  onboarding.tsx       # First-launch 3-step wizard; redirects to (tabs) on completion
  create-player.tsx    # Full-screen (headerShown: false)
  create-game.tsx      # Full-screen (headerShown: false)
  record-result.tsx    # Modal (presentation: "modal")
  game/[id].tsx        # Dynamic route: single-game detail / live view
  (tabs)/
    _layout.tsx        # Bottom tab bar (Home, Games, Players, League)
    index.tsx          # Home dashboard
    games.tsx
    players.tsx
    league.tsx
```

Every non-tab screen is registered as a `Stack.Screen` in `app/_layout.tsx` with `headerShown: false`; only `record-result` uses `presentation: "modal"`. The root layout redirects to `/onboarding` when `hasOnboarded` is false (checked in `HomeScreen` via a `<Redirect>`, `app/(tabs)/index.tsx`).

**Implementation status:** built out — `(tabs)/index.tsx` (home dashboard),
`(tabs)/games.tsx`, `create-player.tsx`, `create-game.tsx` (3-step wizard),
`record-result.tsx`, `game/[id].tsx`, `onboarding.tsx`. Still centered-text
placeholder stubs: **`(tabs)/players.tsx` and `(tabs)/league.tsx`** — the last
two. The tab bar is a custom `FloatingTabBar` with an animated pill
(`(tabs)/_layout.tsx`), not the default tab bar.

### State management

All app state lives in a single **Zustand** store (`store/index.ts`) persisted to **AsyncStorage** under the key `"ballerz-store"`. The three root slices are:

- `players: Player[]` — roster with per-player FIFA-style attributes (pac/sho/pas/dri/def/phy)
- `games: Game[]` — match history; status is `"Pending" | "Live" | "FT"`
- `league: League` — singleton config (name, color, logo, admin, defaults)
- `hasOnboarded: boolean`

All writes go through named store actions (`addPlayer`, `updatePlayer`, `deletePlayer`, `setMvp`, `addGame`, `updateGame`, `deleteGame`, `finishGame`, `setLeague`, `completeOnboarding`, `resetAll`) — never mutate slices directly. New entities get an id from the local `genId()` helper. `setMvp` is exclusive (clears `isMvp` on all other players); `finishGame` is the canonical way to move a game to `"FT"` with score + MVP.

Derived/memoized reads that span multiple slices live in `store/selectors.ts`
(`useLastGame`, `useMvpPlayer`, `useAppStats`, `useRivalry`, `useLastGameRadar`,
`useGamesByStatus`). Use selectors for anything that requires filtering or
aggregation. Aggregations only count games with `status === "FT"`.

**A selector that builds a fresh array or object every call renders forever**
("Maximum update depth exceeded"), and `useShallow` does not save you — it
compares one level deep, so a fresh array inside the returned object is still a
new reference. `useShallow` is only for a flat object of primitives
(`useAppStats`). For anything containing arrays or objects, select the stable
slice and derive with `useMemo` (`useGamesByStatus`, `useLastGameRadar`). The
`using-the-ballerz-store` skill has the before/after.

### Design system

The primary design token object is `T` exported from `constants/theme.ts` — a flat, dark-only palette (no light/dark variants, no `radius` or `accent` keys):

| Token | Value |
|---|---|
| `T.bg` | `#04050B` |
| `T.surface` | `#111525` |
| `T.border` | `#2E385B` |
| `T.textPrimary` | `#CCD0CF` |
| `T.textSecondary` | `#9BA8AB` |
| `T.textMuted` | `#4A5C6A` |

`constants/theme.ts` also exports `Colors` (light/dark) and `Fonts`, plus the `hooks/use-color-scheme*` and `hooks/use-theme-color` helpers — these are leftover Expo template boilerplate; the app's own screens use the `T` palette directly. Radius/spacing values are hard-coded per screen (no shared scale).

Styling is done with `StyleSheet.create` inline in each screen file. There is no
global stylesheet, but shared components do exist in `components/`: `Crest`,
`GameCard`, `GameScoreboard`, and `wizard/{TeamStep,DetailsStep}`. Check there
before building another one.

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
