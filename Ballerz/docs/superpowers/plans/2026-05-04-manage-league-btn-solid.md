# Manage League Button — Solid Amber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal amber gradient on the "Manage League" button with a flat solid amber background.

**Architecture:** Single file edit in `app/(tabs)/index.tsx` — swap `LinearGradient` for `View` inside the button and add `backgroundColor: T.accent` to the `heroCta` style. The `LinearGradient` import is retained as it's still used elsewhere on the screen.

**Tech Stack:** React Native, Expo, TypeScript

---

### Task 1: Replace gradient with solid amber on Manage League button

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Edit the button JSX in `HeroContent`**

In `app/(tabs)/index.tsx`, find the `heroCtaWrap` `TouchableOpacity` (around line 64) and replace the `LinearGradient` with a plain `View`:

```tsx
<TouchableOpacity
  activeOpacity={0.85}
  onPress={() => router.push("/(tabs)/league")}
  style={s.heroCtaWrap}
>
  <View style={s.heroCta}>
    <Text style={s.heroCtaTxt}>Manage League</Text>
  </View>
</TouchableOpacity>
```

- [ ] **Step 2: Update the `heroCta` style**

In the `StyleSheet.create` block, update `heroCta` to add `backgroundColor: T.accent` (the `LinearGradient` previously provided the amber color):

```ts
heroCta: {
  paddingVertical: 13,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  backgroundColor: T.accent,
},
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: 0 errors, same pre-existing warnings as before (none related to this change).

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "fix: use solid amber on Manage League button"
```
