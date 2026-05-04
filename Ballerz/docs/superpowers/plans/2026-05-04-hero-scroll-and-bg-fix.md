# Hero Fixed Scroll + Logo Background Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two issues on the home screen — make only the sheet section scrollable (hero stays fixed), and make the trophy watermark visible when no league logo is set.

**Architecture:** Single file edit in `app/(tabs)/index.tsx`. Move `HeroContent` out of the `ScrollView` into a standalone `View`, shrink the `ScrollView` to cover only the sheet, and change the trophy icon color from `league.color` to `rgba(255,255,255,0.25)`.

**Tech Stack:** React Native, Expo, TypeScript, `react-native-safe-area-context`

---

### Task 1: Fix trophy icon color

**Files:**
- Modify: `app/(tabs)/index.tsx` (line 152)

- [ ] **Step 1: Change the trophy icon color**

On line 152, change:

```tsx
<Ionicons name="trophy" size={210} color={league.color} />
```

To:

```tsx
<Ionicons name="trophy" size={210} color="rgba(255,255,255,0.25)" />
```

- [ ] **Step 2: Verify lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "fix: trophy watermark uses white so it shows through any league gradient"
```

---

### Task 2: Fixed hero + scrollable sheet only

**Files:**
- Modify: `app/(tabs)/index.tsx` (lines 176–189)

- [ ] **Step 1: Replace the ScrollView + HeroContent block**

Find lines 176–189 (the `ScrollView` opening tag through the closing `/>` of `HeroContent`) and replace with:

```tsx
      <View style={{ paddingTop: insets.top + 16 }}>
        <HeroContent
          leagueName={league.name}
          logoUri={league.logoUri}
          color={league.color}
          adminName={league.adminName}
          gamesCount={gamesCount}
          playersCount={playersCount}
        />
      </View>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
```

Key changes:
- `HeroContent` is now in a plain `View` with `paddingTop: insets.top + 16` (inline — no new style key needed)
- The `ScrollView` no longer has `paddingTop` in its `contentContainerStyle`
- The `ScrollView` now starts immediately before the `<View style={s.sheet}>` block

- [ ] **Step 2: Verify lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "fix: hero fixed, only sheet section scrolls"
```
