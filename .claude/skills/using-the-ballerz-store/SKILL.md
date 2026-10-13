---
name: using-the-ballerz-store
description: Use when reading or writing Ballerz app state — players, games, league config — or when adding a selector, and especially when a screen renders forever with "Maximum update depth exceeded" after a game is finished.
---

# Using the Ballerz store

One Zustand store (`store/index.ts`) persisted to AsyncStorage under
`"ballerz-store"`. Slices: `players`, `games`, `league`, `hasOnboarded`.
Cross-slice derived reads live in `store/selectors.ts`.

## Writing

Only through the named actions — `addPlayer`, `updatePlayer`, `deletePlayer`,
`setMvp`, `addGame`, `updateGame`, `deleteGame`, `finishGame`, `setLeague`,
`completeOnboarding`, `resetAll`. Never mutate a slice directly. New entities
get their id from the store's own `genId()`; callers pass `Omit<Entity, "id">`.

- `finishGame(id, homeScore, awayScore, mvpName, mvpStat)` is the only correct
  way to move a game to `"FT"` — it sets status, score and `mvp` together.
- `setMvp` is **exclusive**: it clears `isMvp` on every other player.
- `player.isMvp` ("current MVP of the league") and `game.mvp` (`{name, stat}`
  embedded on that game) are different concepts. Don't sync them.
- `ovr` is always `calculateOvr(pac, sho, pas, dri, def, phy)` from
  `utils/ovr.ts`. Never persist a hand-set OVR; recompute when attributes move.

## The selector stability trap

**A selector that builds a fresh array or object every call will loop forever**
— `useSyncExternalStore` re-renders, the selector returns a new reference,
repeat. It surfaces as "Maximum update depth exceeded" the moment data exists
to filter (e.g. after the first `"FT"` game), so an empty store hides it.

`useShallow` does **not** save you: it compares one level deep, and a fresh
array inside the returned object is still a new reference.

```ts
// WRONG — loops once any game is FT
useStore(useShallow((s) => ({ results: s.games.filter(g => g.status === "FT") })));

// RIGHT — select the stable slice, derive outside the store
const games = useStore((s) => s.games);
return useMemo(() => games.filter(g => g.status === "FT"), [games]);
```

`useShallow` is fine for a flat object of **primitives** (see `useAppStats`).
Use the select-then-`useMemo` shape for anything containing arrays or objects
(see `useGamesByStatus`, `useLastGameRadar`).

This is the one place to ignore CLAUDE.md's "avoid manual useMemo" guidance —
here the memo is load-bearing for referential stability, not an optimization.

## Two more rules

- **Aggregations count only `status === "FT"`.** `"Pending"` and `"Live"` games
  have meaningless scores.
- **Dates are `DD/MM/YYYY` strings.** Sort and compare with `parseGameDate`
  from `utils/game.ts`, never `new Date(g.date)` — JS reads that as
  `MM/DD/YYYY` and returns Invalid Date for any day past the 12th.
