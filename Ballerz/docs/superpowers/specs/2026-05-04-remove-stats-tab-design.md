# Remove Stats Tab

## Summary

Delete the Stats tab from the Ballerz app entirely.

## Changes

1. **Delete** `app/(tabs)/stats.tsx`
2. **Edit** `app/(tabs)/_layout.tsx` — remove the `<Tabs.Screen name="stats" />` entry

## Out of Scope

- `store/selectors.ts` — `useRivalry` and `useLastGameRadar` are kept for potential future use
- All other tabs (Home, Games, Players, League) are unaffected
