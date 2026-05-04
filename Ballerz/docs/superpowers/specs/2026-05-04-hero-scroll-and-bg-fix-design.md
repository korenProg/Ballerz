# Hero Fixed + Logo Background Fix

## Summary

Two related fixes to the home screen hero area:
1. The hero section becomes fixed (non-scrolling); only the sheet below it scrolls.
2. The trophy icon watermark (shown when no league logo is set) becomes visible by using a white semi-transparent color instead of the league accent color that blends into the gradient.

## File

`app/(tabs)/index.tsx` only.

---

## Change 1: Fixed hero + scrollable sheet

### Current structure
```
<View root>
  <bgIconWrap />          ← absolute
  <gradientBg />          ← absolute
  <ScrollView>            ← scrolls everything
    <HeroContent />
    <View sheet>...</View>
  </ScrollView>
</View>
```

### Target structure
```
<View root>
  <bgIconWrap />          ← absolute (unchanged)
  <gradientBg />          ← absolute (unchanged)
  <View heroWrapper>      ← fixed, paddingTop: insets.top + 16
    <HeroContent />
  </View>
  <ScrollView>            ← scrolls sheet only, flex: 1
    <View sheet>...</View>
  </ScrollView>
</View>
```

### Style changes
- Add `heroWrapper`: `{ paddingHorizontal: 0, paddingTop` handled via inline style from `insets.top + 16 }` — no explicit height, wraps HeroContent naturally.
- `scroll` style stays `flex: 1`.
- Remove `paddingTop: insets.top + 16` from `ScrollView`'s `contentContainerStyle` (it moves to `heroWrapper`).
- `content` style: keep `paddingBottom: 0`.

---

## Change 2: Trophy icon watermark color

### Current
```tsx
<Ionicons name="trophy" size={210} color={league.color} />
```
`league.color` is amber — same hue as the `gradientBg` on top, making the icon invisible.

### Target
```tsx
<Ionicons name="trophy" size={210} color="rgba(255,255,255,0.25)" />
```
White at 25% opacity renders as a faint ghost watermark that shows through any league color gradient.

The blurred logo path (when `league.logoUri` is set) is unchanged — the image provides its own contrast.

---

## Out of Scope
- No changes to `HeroContent` internals
- No changes to `bgIconWrap` opacity (0.42 stays)
- No changes to any other screen
