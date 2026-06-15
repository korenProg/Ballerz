# Record Result Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Record Result screen to a broadcast-style layout — two team rows (badge + name left, coloured score input right) inside a single dark card, replacing the current split left/center/right hero.

**Architecture:** Single-file change to `app/record-result.tsx`. The JSX structure of the score section is replaced; the header, ambient gradients, MVP grid, and footer are kept but polished to match the new aesthetic. No new components or store changes needed.

**Tech Stack:** React Native, Expo, StyleSheet, expo-linear-gradient, @expo/vector-icons

---

### Task 1: Replace score hero with broadcast-style card

**Files:**
- Modify: `app/record-result.tsx`

- [ ] **Step 1: Replace the `scoreHero` JSX block**

Find the `{/* Score hero */}` section (lines ~99–140) and replace it entirely with:

```tsx
{/* Score card — broadcast style */}
<View style={s.scoreCard}>
  {/* Home row */}
  <View style={s.teamRow}>
    <View style={s.teamRowLeft}>
      <View style={[s.teamBadge, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
        <Ionicons name="shield" size={16} color={game.homeColor} />
      </View>
      <Text style={s.teamRowName} numberOfLines={1}>{game.homeTeam}</Text>
    </View>
    <TouchableOpacity activeOpacity={0.8} style={[s.scoreBox, { borderColor: game.homeColor + "55" }]}>
      <TextInput
        style={[s.scoreBoxInput, { color: game.homeColor }]}
        value={homeScore}
        onChangeText={setHomeScore}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="0"
        placeholderTextColor={game.homeColor + "33"}
        selectionColor={game.homeColor}
      />
    </TouchableOpacity>
  </View>

  <View style={s.rowDivider} />

  {/* Away row */}
  <View style={s.teamRow}>
    <View style={s.teamRowLeft}>
      <View style={[s.teamBadge, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
        <Ionicons name="shield" size={16} color={game.awayColor} />
      </View>
      <Text style={s.teamRowName} numberOfLines={1}>{game.awayTeam}</Text>
    </View>
    <TouchableOpacity activeOpacity={0.8} style={[s.scoreBox, { borderColor: game.awayColor + "55" }]}>
      <TextInput
        style={[s.scoreBoxInput, { color: game.awayColor }]}
        value={awayScore}
        onChangeText={setAwayScore}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="0"
        placeholderTextColor={game.awayColor + "33"}
        selectionColor={game.awayColor}
      />
    </TouchableOpacity>
  </View>
</View>
```

- [ ] **Step 2: Replace score-related styles**

Remove the old styles: `scoreHero`, `teamSide`, `teamColorDot`, `teamLabel`, `scoreInputWrap`, `scoreInput`, `scoreDivider`, `scoreDash`.

Add these new styles to `StyleSheet.create`:

```ts
scoreCard: {
  borderRadius: 20,
  borderWidth: 1,
  borderColor: T.border,
  backgroundColor: "#0d0e1a",
  marginBottom: 16,
  overflow: "hidden",
},
teamRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  paddingVertical: 14,
},
teamRowLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  flex: 1,
},
teamBadge: {
  width: 36,
  height: 36,
  borderRadius: 18,
  borderWidth: 1.5,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
},
teamRowName: {
  color: T.textPrimary,
  fontSize: 14,
  fontWeight: "700",
  flexShrink: 1,
},
rowDivider: {
  height: 1,
  backgroundColor: T.border,
  marginHorizontal: 16,
},
scoreBox: {
  borderRadius: 12,
  borderWidth: 1.5,
  backgroundColor: "#07080f",
  paddingHorizontal: 14,
  paddingVertical: 6,
  minWidth: 64,
  alignItems: "center",
  justifyContent: "center",
},
scoreBoxInput: {
  fontSize: 36,
  fontWeight: "900",
  letterSpacing: -1,
  padding: 0,
  minWidth: 40,
  textAlign: "center",
},
```

- [ ] **Step 3: Verify no TypeScript errors and the screen renders**

Run: `npm run lint`
Expected: No errors in `record-result.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/record-result.tsx
git commit -m "redesign: record-result broadcast style score card"
```

---

### Task 2: Polish MVP section to match new aesthetic

**Files:**
- Modify: `app/record-result.tsx`

- [ ] **Step 1: Update MVP section styles**

Replace these existing styles:

```ts
// OLD
mvpSection: {
  backgroundColor: T.surface,
  borderRadius: T.radius.card,
  borderWidth: 1, borderColor: T.border,
  padding: 16,
},
```

With:

```ts
// NEW
mvpSection: {
  backgroundColor: "#0d0e1a",
  borderRadius: 20,
  borderWidth: 1,
  borderColor: T.border,
  padding: 16,
},
```

- [ ] **Step 2: Commit**

```bash
git add app/record-result.tsx
git commit -m "polish: mvp section matches new record-result card aesthetic"
```
