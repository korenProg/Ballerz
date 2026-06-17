# Games Tab — Design

**Date:** 2026-06-17
**Status:** Approved (pending spec review)
**Scope:** Full vertical slice of the Games feature — list screen, create/edit/log-result form, game detail with live scoring, and the record-result modal.

## Goal

Turn the placeholder `games.tsx`, `create-game.tsx`, `game/[id].tsx`, and `record-result.tsx` stubs into a working Games feature: a full match list/history, a way to create games (upcoming or backfilled results), a detail view that runs a game live, and a modal to finish a live game.

## Decisions (from brainstorming)

- **Games tab** = full list/history with three sections: **Live → Upcoming → Results**. Swipe-to-delete rows. Tap a row → detail.
- **Create game** = teams + colors + date + location + pick lineups, with a **Upcoming / Log result** mode toggle. "Log result" writes straight to `FT`.
- **Lifecycle**: `Pending → (Start) → Live → (Finish) → FT`. Live score is bumped in the detail view; Finish opens the record-result modal which is the only path that sets `FT` for a live game.
- **MVP** is optional — pick from the game's lineup + a short stat string, or skip.
- **Manage**: swipe-to-delete on the list; **Edit** from the detail view (reopens the create form prefilled).
- **Architecture**: Approach A — one unified `create-game` screen handles create, edit, and log-result via an optional `id` route param.

## Architecture

### Routes (already registered in `app/_layout.tsx`)

| Route | Purpose |
|---|---|
| `app/(tabs)/games.tsx` | List screen (Live / Upcoming / Results sections). |
| `app/create-game.tsx` | Unified create / edit / log-result form. Optional `id` param. |
| `app/game/[id].tsx` | Detail view; adapts to Pending / Live / FT; live scoring. |
| `app/record-result.tsx` | Modal (`presentation: "modal"`) to finish a Live game. |

### Components

- **`components/GameScoreboard.tsx`** — new shared component rendering a matchup (two team badges + names) with either the score (FT/Live) or "vs" + date (Pending), plus the status pill. One clear job; consumed by the detail screen and the list row (and can later replace the home screen's inline `LastGameCard` body). Reuses the existing visual language (team badges, status pills) and the `teamInitials` helper.
- **`GameRow`** — local to `games.tsx`; a compact swipeable list item that composes a condensed scoreboard.
- Each screen keeps its own `StyleSheet.create` (per existing project convention). Colors come from the `T` palette.

### State

- All reads via Zustand selectors; all writes via existing store actions: `addGame`, `updateGame`, `deleteGame`, `finishGame`, `setMvp`, and `updatePlayer` (to bump `mvps`).
- **New selector** in `store/selectors.ts`: `useGamesByStatus()` → `{ live, upcoming, results }`, memoized with `useShallow`. Sorting lives here: upcoming ascending by date, results descending by date.
- No new persisted state — everything fits the current `Game` shape.

## Screens

### Games list (`games.tsx`)

- Fixed top bar (same fixed-bar + scroll pattern as the home screen): title "Games" + a `+` button → `router.push("/create-game")`.
- Scroll body with three sections, each shown only when non-empty, each with a small section header:
  - **LIVE** — `status === "Live"`, pulsing live dot.
  - **UPCOMING** — `status === "Pending"`, soonest first.
  - **RESULTS** — `status === "FT"`, most recent first.
- **`GameRow`**: home badge + name, score (or "vs" + date for Pending), away badge + name, status pill. Wrapped in `Swipeable` (`react-native-gesture-handler`); right-swipe reveals red **Delete** → confirm `Alert` → `deleteGame(id)`. Tap → `router.push(\`/game/${id}\`)`.
- **Empty state** (zero games total): the friendly "No games yet" + Create Game card (same as home), instead of empty sections.
- Requires a `GestureHandlerRootView` at the root if not already mounted (verify during implementation).

### Create / edit / log-result (`create-game.tsx`)

- **Mode detection**: `const { id } = useLocalSearchParams()`. `id` present → edit (prefill, title "Edit Game", `updateGame(id, …)`); absent → create (title "New Game", `addGame(…)`).
- **Segmented toggle: Upcoming · Log result.** Shown when creating, or when editing a Pending game. When editing an FT game, stay in the "result" layout (no toggle).
- **Fields** (full-screen, scrollable; prefilled from `league` defaults where sensible):
  - Home team: name input + color swatch row (default `league.color`).
  - Away team: name input + color swatch row (contrasting default).
  - Date (defaults to today), Location (defaults to `league.defaultLocation`).
  - **Lineups**: two collapsible player pickers (Home squad / Away squad) listing roster players as toggle chips. A player can be on only one side (selecting on one disables on the other). `league.defaultTeamSize` shown as a non-enforced hint. If the roster is empty, show an "Add players first" note linking to `create-player`.
  - **Log result mode only**: score steppers `Home [n] : [m] Away` + optional MVP picker (from selected lineup) + stat text.
- **Lineup snapshot**: selected players are stored on the game as `{ id, name, position }` snapshots (per the `GamePlayer` type), so a game's lineup is preserved even if the player is later edited or deleted.
- **On save**:
  - Upcoming → `status: "Pending"`, `homeScore/awayScore: 0`, empty `mvp`.
  - Log result → `status: "FT"` with entered score; if an MVP is chosen, set `mvp: { name, stat }`, call `setMvp(playerId)`, and bump that player's `mvps` via `updatePlayer`. Then `router.back()`.
- **Validation**: both team names required; everything else optional. Save disabled until valid (mirrors the onboarding `canContinue` pattern).

### Detail (`game/[id].tsx`)

- Reads `id`, pulls the game from the store. **Not found** (bad/deleted id) → "Game not found" + back button.
- Top bar: back + title + **Edit** (→ `/create-game?id=…`).
- Body adapts to status:
  - **Pending**: `GameScoreboard` (vs + date/location), lineups, primary **Start Game** → `updateGame(id, { status: "Live" })`.
  - **Live**: scoreboard with pulsing **LIVE** pill, score steppers `[–] Home [+]   [–] Away [+]` writing through `updateGame` immediately, lineups, primary **Finish** → `router.push("/record-result?id=…")`.
  - **FT**: final scoreboard, MVP highlight (if set), lineups, date/location. Read-only (edit via top-bar Edit).

### Record result modal (`record-result.tsx`)

- Reads `id`. Prefilled final score (from current live score, editable steppers).
- Optional MVP picker from the game's lineups + stat text (skippable).
- **Confirm** → `finishGame(id, homeScore, awayScore, mvpName, mvpStat)`; if MVP chosen, also `setMvp(playerId)` + bump `mvps`. Then `router.back()`.
- Cancel / swipe-down dismisses with no change.

## Data flow & reactivity

- Stepping the live score calls `updateGame` immediately, so the home "Live" card and the list reflect changes in real time via Zustand subscriptions.
- `finishGame` is the only transition that sets `FT` for a live game.

## Edge cases

- **Empty roster** → create-game shows "Add players first"; lineups are optional, so teams-only games still work.
- **Player later deleted/edited** → game keeps its snapshotted lineup and MVP name; history stays intact.
- **MVP double-count guard** → only bump a player's `mvps` on the transition *into* FT with a newly-set MVP; editing an already-FT game must not re-bump.
- **Game not found** → friendly not-found state + back.
- **Same player on both teams** → prevented by the picker.
- **Delete confirmation** → `Alert` before any `deleteGame`.

## Testing (manual — no test suite configured)

Verify in the running app (Expo):
1. Create an **Upcoming** game → appears under UPCOMING.
2. Open it → **Start Game** → moves to LIVE; bump score; home Live card updates.
3. **Finish** → record-result modal → confirm with and without MVP → game shows under RESULTS as FT; MVP highlight shows; player `mvps` bumped exactly once.
4. **Log result** on create → game appears under RESULTS immediately.
5. **Swipe-delete** a row → confirm → removed.
6. **Edit** from detail → form prefilled → save updates the existing game (no duplicate; no MVP double-count).
7. **Empty roster** path → "Add players first"; teams-only game creates fine.
8. Open a deleted/invalid game id → not-found state.

## Out of scope (later rounds)

- Replacing the home screen's inline `LastGameCard` body with the shared `GameScoreboard` (optional cleanup).
- Players/League tab build-outs.
