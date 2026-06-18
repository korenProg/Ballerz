# Task 13: record-result modal — report

## Changes

- **`app/record-result.tsx`**: Replaced the 14-line stub with the full 115-line implementation from the plan.
  - Reads `id` via `useLocalSearchParams<{ id: string }>`.
  - Renders not-found state if game is missing.
  - Pre-fills score steppers from `game.homeScore` / `game.awayScore`.
  - Lists `game.homePlayers + game.awayPlayers` as MVP chips; empty lineup shows hint.
  - `confirm()` calls `finishGame(id, homeScore, awayScore, mvpName, mvpStat)`, then — exactly once when an MVP was chosen — `setMvp(player.id)` and `updatePlayer(player.id, { mvps: player.mvps + 1 })`.
  - Uses `T` tokens throughout; `SafeAreaView`, `ScrollView`, inline `StyleSheet.create`.

## Lint output

```
C:\Users\koren\MyProjects\Ballerz\app\onboarding.tsx
  159:43  error  `'` can be escaped with `&apos;`, ...  react/no-unescaped-entities

✖ 1 problem (1 error, 0 warnings)
```

One pre-existing error in `onboarding.tsx` — no new errors introduced.

## Commit

Short-hash: `05b2eb4`
Message: `feat: record-result modal finishes live games with optional MVP`

## Concerns

**mvps-bump correctness:** The bump runs inside `confirm()` only when `mvpPlayer` is truthy. `finishGame` is called first (moves game to FT), then `setMvp` clears `isMvp` on all other players and sets it on the chosen one, then `updatePlayer` increments `mvps` by 1. This exactly matches the spec ("bump once, when MVP chosen; bump nothing when no MVP"). No risk of double-bump: the modal has no edit mode and closes immediately after `confirm()`.
