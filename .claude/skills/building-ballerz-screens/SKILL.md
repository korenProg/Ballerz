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

Still placeholder stubs: `app/(tabs)/players.tsx`, `app/(tabs)/league.tsx`.

## Styling

`T` from `constants/theme.ts` is the whole token set — six colors, nothing else:

`bg #04050B` · `surface #111525` · `border #2E385B` · `textPrimary #CCD0CF` ·
`textSecondary #9BA8AB` · `textMuted #4A5C6A`

There is **no** `radius`, `spacing` or `accent` token. Hard-code those per
screen, matching whatever the neighbouring screens use. `Colors` and `Fonts`
in the same file are leftover Expo template boilerplate — the app's screens
use `T` directly; don't start using `Colors`.

Reusable pieces already exist in `components/`: `Crest`, `GameCard`,
`GameScoreboard`, and `wizard/{TeamStep,DetailsStep}`. Check there before
building another one.

Player photos and league logos are local `file://` URIs from
`expo-image-picker`. Nothing is uploaded anywhere.

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
