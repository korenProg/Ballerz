# Dark Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the app into a consistent deep-space dark design system — converting the Home screen's white bottom sheet to dark, reskinning the Leaderboard component, polishing all tabs with consistent micro-interactions and empty states, and styling the tab bar to match.

**Architecture:** Pure style changes across 6 existing files. No new files, no new components, no logic changes. Each task is one file — safe to implement and commit independently.

**Tech Stack:** React Native, Expo, StyleSheet.create, `constants/theme.ts` T tokens (`T.bg`, `T.surface`, `T.border`, `T.accent`, `T.textPrimary`, `T.textSecondary`, `T.textMuted`)

---

## Files Modified

| File | What changes |
|---|---|
| `app/(tabs)/_layout.tsx` | Tab bar background, active/inactive tint colors |
| `components/Leaderboard.tsx` | Full dark reskin of all style tokens |
| `app/(tabs)/index.tsx` | Sheet background, game card colors, empty state, section title color |
| `app/(tabs)/games.tsx` | Filter bar height+separator, card activeOpacity, edit CTA, empty state |
| `app/(tabs)/players.tsx` | Row activeOpacity, summary pill accent, empty state |
| `app/(tabs)/stats.tsx` | Section eyebrow accent border, empty state card |

---

## Task 1: Tab Bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add T import and update screenOptions**

Replace the entire file with:

```tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: T.bg, borderTopColor: T.border },
      tabBarActiveTintColor: T.accent,
      tabBarInactiveTintColor: T.textMuted,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color }) => <Ionicons name="football" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: 'League',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify visually**

Run `npm start`, open the app. The tab bar should now be `#07080f` (matching the screen backgrounds), active tab icon is amber, inactive icons are dark muted.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: style tab bar to match dark theme"
```

---

## Task 2: Leaderboard Dark Reskin

**Files:**
- Modify: `components/Leaderboard.tsx`

- [ ] **Step 1: Replace the StyleSheet**

Find the `const s = StyleSheet.create({...})` block (starts at line 110) and replace it entirely with:

```tsx
const s = StyleSheet.create({
  container: {
    backgroundColor: T.surface,
    borderRadius: T.radius.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  hTxt: {
    fontSize: 8,
    fontWeight: "800",
    color: T.textMuted,
    letterSpacing: 1,
    textAlign: "center",
  },
  headerCell: { alignItems: "center", justifyContent: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rowFirst: { backgroundColor: "rgba(245,158,11,0.06)" },
  rowLast: { borderBottomWidth: 0 },

  pos: { width: COL_POS, fontSize: 12, fontWeight: "800", color: T.textMuted, textAlign: "center" },

  nameCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 9, fontWeight: "800", color: T.textSecondary },
  nameText: { flex: 1, fontSize: 13, fontWeight: "700", color: T.textPrimary },

  cell: { alignItems: "center" },
  statVal: { fontSize: 13, fontWeight: "700", color: T.textMuted },

  ovrBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  ovrTxt: { fontSize: 12, fontWeight: "900" },
});
```

- [ ] **Step 2: Verify visually**

Open the Home tab. The leaderboard should now render with a glass-dark card background, white player names, amber/blue OVR badges unchanged.

- [ ] **Step 3: Commit**

```bash
git add components/Leaderboard.tsx
git commit -m "feat: dark reskin Leaderboard component"
```

---

## Task 3: Home Screen — Dark Sheet & Game Cards

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Update the sheet style**

Find `sheet:` in the StyleSheet and replace:

```tsx
sheet: {
  backgroundColor: T.bg,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  borderTopWidth: 1,
  borderTopColor: T.border,
  marginTop: -20,
  paddingTop: 20,
  minHeight: 200,
},
```

- [ ] **Step 2: Update sectionTitle color**

Find `sectionTitle:` and replace:

```tsx
sectionTitle: {
  fontSize: 9,
  fontWeight: "800",
  letterSpacing: 2,
  color: T.textMuted,
},
```

- [ ] **Step 3: Update game card styles**

Find and replace each of these style entries:

```tsx
gameCard: {
  width: "47.5%",
  backgroundColor: T.surface,
  borderRadius: T.radius.card,
  borderWidth: 1,
  borderColor: T.border,
  padding: 12,
},
ftPill: {
  backgroundColor: "rgba(255,255,255,0.06)",
  borderRadius: 5,
  paddingHorizontal: 6,
  paddingVertical: 2,
},
ftTxt: {
  color: T.textMuted,
  fontSize: 8,
  fontWeight: "800",
  letterSpacing: 1,
},
gameDate: { color: T.textMuted, fontSize: 9 },
gameTeamName: { color: T.textSecondary, fontSize: 11, fontWeight: "700" },
gameScore: {
  fontSize: 16,
  fontWeight: "900",
  color: T.textPrimary,
  paddingHorizontal: 6,
  textAlign: "center",
},
gameScoreSep: { color: T.textMuted, fontWeight: "300" },
gameLocationTxt: { color: T.textMuted, fontSize: 9 },
```

- [ ] **Step 4: Update the empty state JSX**

Find the empty state block (inside the sheet, the `{gamesCount === 0 && players.length === 0 && (...)}` block) and replace it with:

```tsx
{gamesCount === 0 && players.length === 0 && (
  <View style={s.emptyCard}>
    <Ionicons name="football-outline" size={32} color={T.textMuted} />
    <Text style={s.emptyTitle}>No games yet</Text>
    <Text style={s.emptyText}>Create your first game to get started</Text>
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push("/create-game")}
      style={s.emptyCtaWrap}
    >
      <LinearGradient
        colors={["#f59e0b", "#d97706"]}
        style={s.emptyCta}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={s.emptyCtaTxt}>Create Game</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
)}
```

- [ ] **Step 5: Update empty state styles**

Replace the old `emptyState`, `emptyText`, `emptyCtaWrap`, `emptyCta`, `emptyCtaTxt` styles with:

```tsx
emptyCard: {
  margin: 16,
  backgroundColor: T.surface,
  borderRadius: T.radius.card,
  borderWidth: 1,
  borderColor: T.border,
  padding: 28,
  alignItems: "center",
  gap: 8,
},
emptyTitle: {
  color: T.textPrimary,
  fontSize: 15,
  fontWeight: "800",
},
emptyText: {
  color: T.textMuted,
  fontSize: 13,
  fontWeight: "600",
  textAlign: "center",
},
emptyCtaWrap: {
  width: "100%",
  borderRadius: T.radius.pill,
  overflow: "hidden",
  marginTop: 8,
},
emptyCta: {
  paddingVertical: 14,
  alignItems: "center",
  justifyContent: "center",
},
emptyCtaTxt: { color: "#000", fontSize: 15, fontWeight: "800" },
```

- [ ] **Step 6: Verify visually**

Open Home tab. The bottom sheet is now dark, game cards are dark glass, leaderboard is dark. The whole screen should feel like one cohesive dark product.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: convert home screen bottom sheet and game cards to dark theme"
```

---

## Task 4: Games Tab Polish

**Files:**
- Modify: `app/(tabs)/games.tsx`

- [ ] **Step 1: Reduce filter bar height and add separator**

Find `ft` StyleSheet (the `const ft = StyleSheet.create({...})` block near the top) and update `bar`:

```tsx
bar: { height: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: T.border },
```

- [ ] **Step 2: Fix game card activeOpacity**

Find the `GameCard` component's root `TouchableOpacity` (around line 471 in the original, now shifted):

```tsx
<TouchableOpacity
  activeOpacity={0.75}
  onPress={selectable ? onSelect : isCompleted ? onTap : undefined}
  style={[styles.card, selected && styles.cardSelected]}
>
```

- [ ] **Step 3: Update "Edit result" CTA text style**

Find `recordCtaText` in the StyleSheet and replace:

```tsx
recordCtaText: { color: T.accent, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },
```

- [ ] **Step 4: Replace the empty state JSX**

Find the empty state block inside the ScrollView:

```tsx
{visibleGames.length === 0 ? (
  <View style={styles.emptyCard}>
    <Ionicons name="football-outline" size={32} color={T.textMuted} />
    <Text style={styles.emptyTitle}>
      {activeFilter === "All" ? "No games yet" : `No ${activeFilter.toLowerCase()} games`}
    </Text>
    {activeFilter === "All" && (
      <Text style={styles.emptySubtitle}>Create your first game to get started</Text>
    )}
    {activeFilter === "All" && (
      <TouchableOpacity onPress={() => router.push("/create-game")} style={styles.emptyBtn} activeOpacity={0.85}>
        <Text style={styles.emptyBtnTxt}>New Game</Text>
      </TouchableOpacity>
    )}
  </View>
) : (
```

- [ ] **Step 5: Replace empty state styles**

Remove `emptyState` and `emptyText` from the StyleSheet and add:

```tsx
emptyCard: { margin: 16, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: "center", gap: 10 },
emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center" },
emptyBtn: { marginTop: 4, backgroundColor: T.accent, borderRadius: T.radius.pill, paddingHorizontal: 24, paddingVertical: 11 },
emptyBtnTxt: { color: "#000", fontSize: 14, fontWeight: "800" },
```

- [ ] **Step 6: Verify visually**

Games tab: filter bar is 44px tall with a subtle separator, cards animate on press, "Edit result" has an underline, empty state is a glass card.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/games.tsx
git commit -m "feat: games tab polish — filter bar, press feedback, empty state"
```

---

## Task 5: Players Tab Polish

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Add activeOpacity to PlayerRow**

Find the root `TouchableOpacity` in the `PlayerRow` component and ensure it has `activeOpacity={0.75}`:

```tsx
<TouchableOpacity
  activeOpacity={0.75}
  onPress={selectable ? onSelect : onTap}
  style={[styles.row, selected && styles.rowSelected]}
>
```

- [ ] **Step 2: Accent the OVR average summary pill**

Find the second `summaryPill` in the JSX (the "Avg OVR" one) and add an inline style for the left border:

```tsx
<View style={[styles.summaryPill, { borderLeftWidth: 2, borderLeftColor: T.accent }]}>
  <Ionicons name="stats-chart-outline" size={13} color="#aaa" />
  <Text style={styles.summaryText}>
    Avg {players.length > 0 ? Math.round(players.reduce((s, p) => s + p.ovr, 0) / players.length) : "—"} OVR
  </Text>
</View>
```

- [ ] **Step 3: Add empty state inside the ScrollView**

In the `ScrollView`'s content, after the `mvpPlayer` block and before/after the `sorted.map(...)`, add an empty state when `sorted.length === 0`:

```tsx
{sorted.length === 0 && (
  <View style={styles.emptyCard}>
    <Ionicons name="person-outline" size={32} color={T.textMuted} />
    <Text style={styles.emptyTitle}>{search ? "No players found" : "No players yet"}</Text>
    {!search && <Text style={styles.emptySubtitle}>Add your first player to get started</Text>}
    {!search && (
      <TouchableOpacity onPress={() => router.push("/create-player")} style={styles.emptyBtn} activeOpacity={0.85}>
        <Text style={styles.emptyBtnTxt}>Add Player</Text>
      </TouchableOpacity>
    )}
  </View>
)}
{sorted.map((player, index) => (
  <PlayerRow ... />
))}
```

- [ ] **Step 4: Add empty state styles to StyleSheet**

```tsx
emptyCard: { marginTop: 24, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: "center", gap: 10 },
emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center" },
emptyBtn: { marginTop: 4, backgroundColor: T.accent, borderRadius: T.radius.pill, paddingHorizontal: 24, paddingVertical: 11 },
emptyBtnTxt: { color: "#000", fontSize: 14, fontWeight: "800" },
```

- [ ] **Step 5: Verify visually**

Players tab: rows animate on press, the OVR pill has an amber left-border accent, empty state shows when no players exist.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: players tab polish — press feedback, OVR accent, empty state"
```

---

## Task 6: Stats Tab Polish

**Files:**
- Modify: `app/(tabs)/stats.tsx`

- [ ] **Step 1: Add accent border to section eyebrows**

Find `sectionEyebrow` in the StyleSheet and replace:

```tsx
sectionEyebrow: {
  fontSize: 9,
  fontWeight: "800",
  letterSpacing: 2,
  color: T.textMuted,
  textTransform: "uppercase",
  marginBottom: 8,
  marginTop: 20,
  borderLeftWidth: 2,
  borderLeftColor: T.accent,
  paddingLeft: 6,
},
```

- [ ] **Step 2: Replace empty state JSX**

Find the empty state block at the bottom of the ScrollView:

```tsx
{gamesCount === 0 && (
  <View style={s.emptyCard}>
    <Ionicons name="stats-chart-outline" size={32} color={T.textMuted} />
    <Text style={s.emptyTitle}>No stats yet</Text>
    <Text style={s.emptySubtitle}>Play some games to see your league stats here</Text>
  </View>
)}
```

- [ ] **Step 3: Replace empty state styles**

Remove `emptyState` and `emptyText` from the StyleSheet and add:

```tsx
emptyCard: { marginTop: 24, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: "center", gap: 10 },
emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: "800" },
emptySubtitle: { color: T.textMuted, fontSize: 13, textAlign: "center" },
```

- [ ] **Step 4: Verify visually**

Stats tab: "RIVALRY" and "LAST MATCH COMPARISON" eyebrows have a thin amber left border. Empty state is a glass card instead of floating text.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/stats.tsx
git commit -m "feat: stats tab polish — eyebrow accents, empty state card"
```
