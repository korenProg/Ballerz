# create-game implementation report

## Status: DONE

## Commits (in order)

| Task | Short hash | Message |
|------|-----------|---------|
| Task 6 base | 1290f71 | feat: create-game base form creates Pending games |
| Task 6 EXTENSION | 285b119 | feat: per-team logo pickers in create-game |
| Task 7 | 0c448e8 | feat: create-game lineup pickers with mutually-exclusive sides |
| Task 8 | 5beba34 | feat: create-game log-result mode with score + optional MVP |
| Task 9 | b9fedde | feat: create-game edit mode (prefill + updateGame, no mvps re-bump) |

## npm run lint — per run

All five runs produced exactly one error:
```
app/onboarding.tsx  159:43  error  react/no-unescaped-entities
```
This is the pre-existing error documented in CLAUDE.md. Zero new errors introduced across all tasks.

## Per-section changes

### Task 6 (base form)
- Replaced stub with full `CreateGameScreen`: `homeTeam`, `awayTeam`, `homeColor`, `awayColor`, `date`, `location` state.
- `save()` calls `addGame()` with `status: "Pending"` and `router.back()`.
- `ColorRow` helper component with 8 TEAM_COLORS swatches.
- Imports: `useStore`, `formatDate`, `T`, `SafeAreaView`, `KeyboardAvoidingView`, `Ionicons`.

### Task 6 EXTENSION (logo pickers)
- Added `expo-image-picker` import and `Image` from RN.
- `homeLogo`/`awayLogo` state (null for new games).
- `pickLogo(set)` async helper using `launchImageLibraryAsync`.
- Logo slot UI rendered below each team's color row.
- `save()` extended: `homeLogo: homeLogo ?? undefined, awayLogo: awayLogo ?? undefined` in the payload.

### Task 7 (lineup pickers)
- Added `players` from store.
- `homePlayerIds`/`awayPlayerIds` state (empty arrays).
- `toggle(side, id)` — mutually exclusive: selecting a player for one side removes them from the other.
- `snapshot(ids)` — maps IDs to `{ id, name, position }` GamePlayer objects, filtering missing players.
- Lineup UI: two chip rows (Home squad / Away squad), shown after Location field; if no players, shows link to create-player.
- `save()` now uses `snapshot(homePlayerIds)` / `snapshot(awayPlayerIds)` instead of `[]`.

### Task 8 (log-result mode)
- Added `setMvp`, `updatePlayer` from store.
- New state: `mode`, `homeScore`, `awayScore`, `mvpId`, `mvpStat`.
- `lineup` derived array from both player ID lists.
- Segment toggle (Upcoming / Log result) at top of ScrollView.
- Result fields (score steppers + MVP picker + MVP stat input) shown only in result mode.
- `Stepper` component.
- `save()` replaced with branched version using shared `base` object:
  - `mode === "result"`: `addGame({ ...base, status: "FT", ... })` + `setMvp` + `updatePlayer mvps+1` if mvpPlayer.
  - else: `addGame({ ...base, status: "Pending", ... })`.
- Button label changes to "Save Result" in result mode.

### Task 9 (edit mode)
- Added `useLocalSearchParams` import.
- Added `updateGame` from store.
- `editing` derived from `s.games.find(g => g.id === id)`.
- All `useState` initializers updated to prefer `editing?.field ?? fallback`.
  - Includes logos: `editing?.homeLogo ?? null` / `editing?.awayLogo ?? null`.
  - Includes lineups: `editing?.homePlayers?.map(p => p.id) ?? []`.
  - `mode` init: `editing?.status === "FT" ? "result" : "upcoming"`.
  - `mvpStat` init: `editing?.mvp?.stat ?? ""`.
  - `mvpId` stays `null` (not pre-filled; intentional — edit mode never re-bumps mvps).
- `save()` now has edit branch at the top (after canSave guard):
  - If `editing`: calls `updateGame(editing.id, { ...base, ... })` for both modes, returns early.
  - NO `setMvp`/`updatePlayer` call in edit branch (enforces "no mvps re-bump" invariant).
  - Existing add logic unchanged below.
- Header title: `editing ? "Edit Game" : "New Game"`.

## save() / useState reconciliation (Tasks 6/8/9)

The `save()` function progressed through three versions:
1. **Task 6**: single `addGame(Pending)` call.
2. **Task 8**: replaced with `base` object + branched add (result vs upcoming).
3. **Task 9**: edit branch inserted before add logic; both branches share the same `base`.

Final shape of `save()`:
```
canSave guard
→ build base (includes homeLogo/awayLogo/homePlayers/awayPlayers)
→ if (editing) { updateGame + return }   // no mvps bump
→ if (mode==="result") { addGame FT + setMvp + updatePlayer }
→ else { addGame Pending }
→ router.back()
```

The `useState` initializers were progressively extended from plain defaults (Task 6) to edit-aware fallbacks (Task 9). The final state matches exactly what Tasks 8 and 9 specified.

## Logo flow through all save branches

`homeLogo`/`awayLogo` are included in `base` as:
```ts
homeLogo: homeLogo ?? undefined,
awayLogo: awayLogo ?? undefined,
```
`base` is spread into every `addGame` and `updateGame` call, so logos flow through:
- create + upcoming
- create + result
- edit + upcoming
- edit + result

In edit mode, logos initialize from `editing?.homeLogo ?? null` / `editing?.awayLogo ?? null`.

## mvps-bump guard

`updatePlayer(id, { mvps: mvps+1 })` is called ONLY in the `addGame` result path (Task 8). The `editing` branch (Task 9) does NOT call `setMvp` or `updatePlayer`. This is enforced by the `router.back(); return;` early exit after `updateGame`.
