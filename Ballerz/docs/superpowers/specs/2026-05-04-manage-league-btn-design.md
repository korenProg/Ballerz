# Manage League Button — Solid Amber

## Summary

Replace the horizontal amber gradient on the "Manage League" button in the home screen hero with a flat solid amber background to better match the app's design system.

## Change

**File:** `app/(tabs)/index.tsx`

Inside `HeroContent`, replace the `LinearGradient` wrapping the button text with a plain `View`:

```tsx
// Before
<LinearGradient colors={["#f59e0b", "#d97706"]} style={s.heroCta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
  <Text style={s.heroCtaTxt}>Manage League</Text>
</LinearGradient>

// After
<View style={s.heroCta}>
  <Text style={s.heroCtaTxt}>Manage League</Text>
</View>
```

Add `backgroundColor: T.accent` to the `heroCta` StyleSheet entry.

## Out of Scope

- `LinearGradient` import stays (used for hero background gradient and empty-state "Create Game" button)
- No other buttons or styles change
