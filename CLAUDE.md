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

No test suite is configured.

## Architecture

**Ballerz** is a React Native app (Expo SDK 54, file-based routing via expo-router) for managing amateur football leagues. It targets iOS, Android, and web from a single codebase.

### Routing structure

```
app/
  _layout.tsx          # Root Stack: tabs + modals (create-player, record-result)
  onboarding.tsx       # First-launch 3-step wizard; redirects to (tabs) on completion
  create-player.tsx    # Modal screen
  create-game.tsx      # Full-screen flow
  record-result.tsx    # Modal screen
  (tabs)/
    _layout.tsx        # Bottom tab bar (Home, Games, Players, Stats, League)
    index.tsx          # Home dashboard
    games.tsx
    players.tsx
    stats.tsx
    league.tsx
```

The root layout redirects to `/onboarding` when `hasOnboarded` is false (checked in `HomeScreen` via a `<Redirect>`).

### State management

All app state lives in a single **Zustand** store (`store/index.ts`) persisted to **AsyncStorage** under the key `"ballerz-store"`. The three root slices are:

- `players: Player[]` — roster with per-player FIFA-style attributes (pac/sho/pas/dri/def/phy)
- `games: Game[]` — match history; status is `"Pending" | "Live" | "FT"`
- `league: League` — singleton config (name, color, logo, admin, defaults)
- `hasOnboarded: boolean`

Derived/memoized reads that span multiple slices live in `store/selectors.ts` (e.g. `useLastGameRadar`, `useRivalry`). Use selectors for anything that requires filtering or aggregation; prefer `useShallow` when returning objects from a selector.

### Design system

The primary design token object is `T` exported from `constants/theme.ts`. Key values:

| Token | Value |
|---|---|
| `T.bg` | `#07080f` (deep-space dark) |
| `T.accent` | `#f59e0b` (amber) |
| `T.surface` | `rgba(255,255,255,0.04)` |
| `T.textPrimary` | `#ffffff` |
| `T.radius.card` | `22` |

The home screen uses a white bottom sheet (`backgroundColor: "#fff"`) overlaid on a dark hero — this is intentional; the sheet and the hero have distinct color schemes.

Styling is done with `StyleSheet.create` inline in each screen file. There is no global stylesheet or component library.

### Player attributes

`ovr` is always computed via `utils/ovr.ts:calculateOvr` (average of pac/sho/pas/dri/def/phy). Never persist a manually set OVR; always recompute when attributes change.

### Key conventions

- `expo-router` navigation uses typed routes (`experiments.typedRoutes: true` in app.json) — use `router.push("/route")` with string literals.
- `@/` path alias maps to the project root (configured in tsconfig).
- The React Compiler is enabled (`experiments.reactCompiler: true`); avoid manual `useMemo`/`useCallback` unless there's a specific reason.
- Images (player photos, league logos) are stored as local `file://` URIs via `expo-image-picker`, not uploaded anywhere.
