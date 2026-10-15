---
name: building-ballerz-screens
description: Use when adding or editing a Ballerz screen or component — new route, styling with the T palette, or fixing `react-hooks/refs` "Cannot access refs during render" lint errors from the React Compiler.
---

# Building Ballerz screens

expo-router file-based routing, dark-only palette, `StyleSheet.create` per file.
No global stylesheet. `@/` maps to the project root.

## Adding a route

1. Create the file under `app/`.
2. **Register every non-tab screen** in `app/_layout.tsx` as a `Stack.Screen`
   with `options={{ headerShown: false }}`. A screen that works without being
   registered will show a stock header you don't want.
3. Navigate with typed routes: `router.push("/create-game")` as a string
   literal (`experiments.typedRoutes` is on).

Conventions in the existing full-screen routes: `presentation: "modal"` only
for `record-result`; `gestureEnabled: false` for `onboarding`. Tab screens live
in `app/(tabs)/` and need no registration — the tab bar is the custom
`FloatingTabBar` in `app/(tabs)/_layout.tsx`, not the default one.

## Styling

FotMob-style dark UI. `T` from `constants/theme.ts`: `bg #000000` ·
`surface #1A1A1A` · `surfaceAlt #262626` · `divider #2B2B2B` · `text #F2F2F2` ·
`textDim #A3A3A3` · `textFaint #8A8A8A` · `accent #2FD47A` · `red` · `yellow`.
`TYPE`, `SPACE` and `RADIUS` hold the type scale, spacing and radii.

Compose screens from `components/ui/` (`ScreenHeader`, `Section`, `ListRow`,
`Tabs`, `RatingBadge`, `StatCompare`, `Button`, `IconButton`, `EmptyState`)
before writing new styles. Cards have no border, weights stop at 700, numbers
are tabular, and the green accent marks active, live and primary — nothing
decorative. No watermark icons, no letter-spaced eyebrow labels, no gradients.

Player photos and league logos are local `file://` URIs from
`expo-image-picker`. `Crest` shows them, falling back to initials (team colour
for teams, neutral grey with `variant="avatar"` for players).

## React Compiler: no refs during render

`reactCompiler` is enabled and `eslint-plugin-react-hooks` v7 enforces it. The
compiler can miscompile a component that touches a ref while rendering, so
`react-hooks/refs` errors are real, not noise. Reading or writing `.current`
is only legal inside an event handler or an effect.

```tsx
// WRONG: .current read during render
const translateX = useRef(new Animated.Value(0)).current;
// RIGHT: lazy state — same stable identity, no render-phase ref read
const [translateX] = useState(() => new Animated.Value(0));

// WRONG: ref write during render
onChangeRef.current = onChange;
// RIGHT
useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
```

Also avoid passing a ref-reading function into a factory during render —
that's why the attribute sliders use the View's own
`onStartShouldSetResponder` / `onResponderGrant` / `onResponderMove` props
instead of `PanResponder.create`. For a drag that needs only `locationX`, the
raw responder props are equivalent and lint-clean.
