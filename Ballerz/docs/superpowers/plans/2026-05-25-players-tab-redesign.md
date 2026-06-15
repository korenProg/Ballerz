# Players Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Players tab with richer list rows (top-3 attribute pills), a grid/list view toggle, and dynamic position filter tabs; remove goals & assists from all display.

**Architecture:** All changes are contained in `app/(tabs)/players.tsx`. New sub-components (`PositionTabs`, `GridCard`) are defined in the same file following the existing pattern. `Dimensions` is used to compute the grid item width for a precise 3-column layout.

**Tech Stack:** React Native, Expo, TypeScript, Zustand, expo-linear-gradient, @expo/vector-icons, react-native-safe-area-context

---

## File Map

| File | Change |
|------|--------|
| `app/(tabs)/players.tsx` | All changes — remove G/A display, add pills, PositionTabs, GridCard, toggle |

---

### Task 1: Remove goals & assists from all display

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Remove from PlayerRow sub-text**

In `PlayerRow` (around line 505), change:
```tsx
<Text style={styles.playerSub}>
  {player.position} · {player.goals}G · {player.assists}A · {player.mvps} MVPs
</Text>
```
To:
```tsx
<Text style={styles.playerSub}>
  {player.position} · {player.mvps} MVPs
</Text>
```

- [ ] **Step 2: Remove from MvpCard sub-text**

In `MvpCard` (around line 435), change:
```tsx
<Text style={styles.mvpCardSub}>
  {player.position} · {player.goals}G · {player.assists}A · {player.mvps} MVPs
</Text>
```
To:
```tsx
<Text style={styles.mvpCardSub}>
  {player.position} · {player.mvps} MVPs
</Text>
```

- [ ] **Step 3: Remove from CardBack career stats**

In `CardBack` (around line 176), replace the entire career stats section:
```tsx
<Text style={[cs.backSectionTitle, { color, marginBottom: 10 }]}>CAREER STATS</Text>
<View style={cs.careerRow}>
  {[
    { val: player.goals,   lbl: "Goals"  },
    { val: player.assists, lbl: "Assists" },
    { val: player.mvps,    lbl: "MVPs"   },
  ].map((s, i) => (
    <React.Fragment key={s.lbl}>
      {i > 0 && <View style={[cs.careerDiv, { backgroundColor: color + "25" }]} />}
      <View style={cs.careerCell}>
        <Text style={[cs.careerVal, { color }]}>{s.val}</Text>
        <Text style={cs.careerLbl}>{s.lbl}</Text>
      </View>
    </React.Fragment>
  ))}
</View>
```
With:
```tsx
<Text style={[cs.backSectionTitle, { color, marginBottom: 10 }]}>CAREER STATS</Text>
<View style={cs.careerRow}>
  <View style={cs.careerCell}>
    <Text style={[cs.careerVal, { color }]}>{player.mvps}</Text>
    <Text style={cs.careerLbl}>MVPs</Text>
  </View>
</View>
```

- [ ] **Step 4: Verify and commit**

Run `npm start`, open Players tab, tap a player card — confirm no goals/assists anywhere.

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: remove goals & assists from players display"
```

---

### Task 2: Add top-3 attribute pills to PlayerRow

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Add top3Attrs helper**

After the existing `attrColor` helper (around line 63), add:
```tsx
function top3Attrs(player: Player): { label: string; val: number }[] {
  return ATTRS
    .map(a => ({ label: a.label, val: player[a.key] }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);
}
```

- [ ] **Step 2: Add pill row to PlayerRow**

In `PlayerRow`, inside the `playerInfo` View, after the `playerSub` Text (and after the mvpPill logic), add:
```tsx
<View style={styles.attrPills}>
  {top3Attrs(player).map(p => (
    <View key={p.label} style={[styles.attrPill, { backgroundColor: attrColor(p.val) + "18" }]}>
      <Text style={[styles.attrPillText, { color: attrColor(p.val) }]}>{p.label} {p.val}</Text>
    </View>
  ))}
</View>
```

- [ ] **Step 3: Add pill styles**

Add to `StyleSheet.create` at the bottom of the file:
```tsx
attrPills:    { flexDirection: "row", gap: 4, marginTop: 4 },
attrPill:     { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
attrPillText: { fontSize: 9, fontWeight: "700" },
```

- [ ] **Step 4: Verify and commit**

Run `npm start` — each player row should now show three colored attribute pills below the position/MVPs line.

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: add top-3 attribute pills to player rows"
```

---

### Task 3: Add dynamic position filter tabs

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Add PositionTabs component**

Add this component above `PlayersScreen` (after the existing `ConfirmDialog` component):
```tsx
function PositionTabs({ players, active, onChange }: {
  players: Player[]; active: string; onChange: (pos: string) => void;
}) {
  const positions = [...new Set(players.map(p => p.position))].sort();
  const counts: Record<string, number> = { ALL: players.length };
  positions.forEach(pos => { counts[pos] = players.filter(p => p.position === pos).length; });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={pt.bar}
      contentContainerStyle={pt.content}
    >
      {(["ALL", ...positions] as string[]).map(pos => {
        const isActive = pos === active;
        return (
          <TouchableOpacity
            key={pos}
            onPress={() => onChange(pos)}
            activeOpacity={0.75}
            style={[pt.pill, isActive && pt.pillActive]}
          >
            <Text style={[pt.label, isActive && pt.labelActive]}>
              {pos} · {counts[pos]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const pt = StyleSheet.create({
  bar:        { marginBottom: 8 },
  content:    { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  pill:       { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  label:      { fontSize: 10, fontWeight: "700", color: T.textMuted },
  labelActive:{ color: "#000" },
});
```

- [ ] **Step 2: Add positionFilter state to PlayersScreen**

In `PlayersScreen`, after the existing `useState` declarations, add:
```tsx
const [positionFilter, setPositionFilter] = useState("ALL");
```

- [ ] **Step 3: Apply position filter to sorted array**

Find the existing `sorted` computation (around line 620) and add a position filter step:
```tsx
const sorted = [...players]
  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  .filter(p => positionFilter === "ALL" || p.position === positionFilter)
  .sort((a, b) => {
    if (sortMode === "ovr_asc") return a.ovr - b.ovr;
    if (sortMode === "goals")   return b.goals - a.goals;
    if (sortMode === "mvps")    return b.mvps - a.mvps;
    return b.ovr - a.ovr;
  });
```

- [ ] **Step 4: Render PositionTabs in the screen**

In `PlayersScreen`'s return, add `<PositionTabs>` after the `<TopBar>` block and before the search/sort `<Animated.View>`:
```tsx
<PositionTabs
  players={players}
  active={positionFilter}
  onChange={(pos) => { setPositionFilter(pos); }}
/>
```

- [ ] **Step 5: Verify and commit**

Run `npm start` — confirm position tabs appear, tapping one filters the list, "ALL" shows everyone.

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: add dynamic position filter tabs to players tab"
```

---

### Task 4: Add grid/list toggle and GridCard

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Import Dimensions**

At the top of the file, add `Dimensions` to the react-native import:
```tsx
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TouchableWithoutFeedback, Animated, Modal, TextInput,
  Image, Dimensions,
} from "react-native";
```

Then add this constant right after the imports (before the `type SortMode` line):
```tsx
const SCREEN_W = Dimensions.get("window").width;
const GRID_ITEM_W = (SCREEN_W - 32 - 16) / 3; // 32px total h-padding, 16px for 2 gaps of 8
```

- [ ] **Step 2: Add GridCard component**

Add this component above `PlayersScreen`:
```tsx
function GridCard({ player, onTap }: { player: Player; onTap: () => void }) {
  const tier     = ovrTier(player.ovr);
  const color    = TIER_COLOR[tier];
  const gradient = TIER_GRADIENT[tier];
  const lastName = player.name.split(" ").slice(-1)[0].toUpperCase();

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.75} style={gs.card}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={gs.inner}>
        <View style={[gs.avatar, { borderColor: color + "66" }]}>
          <PlayerPhoto photo={player.photo} name={player.name} size={36} color={color} />
        </View>
        <Text style={[gs.ovr, { color }]}>{player.ovr}</Text>
        <Text style={gs.lastName} numberOfLines={1}>{lastName}</Text>
        <Text style={gs.pos}>{player.position}</Text>
        {player.form !== "neutral" && (
          <Ionicons
            name={player.form === "hot" ? "flame-outline" : "snow-outline"}
            size={10}
            color={player.form === "hot" ? "#f97316" : "#60a5fa"}
            style={{ marginTop: 2 }}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const gs = StyleSheet.create({
  card:   { width: GRID_ITEM_W, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#ffffff0d" },
  inner:  { padding: 10, alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, overflow: "hidden", marginBottom: 6, backgroundColor: "#ffffff0a" },
  ovr:    { fontSize: 18, fontWeight: "900", lineHeight: 20 },
  lastName: { color: "#fff", fontSize: 9, fontWeight: "800", marginTop: 3 },
  pos:    { color: "#555", fontSize: 8, marginTop: 1 },
});
```

- [ ] **Step 3: Add viewMode state to PlayersScreen**

In `PlayersScreen`, add after the existing state declarations:
```tsx
const [viewMode, setViewMode] = useState<"list" | "grid">("list");
```

- [ ] **Step 4: Update TopBar right prop to include toggle**

Replace the existing `right` prop on `<TopBar>` with:
```tsx
right={
  selectMode ? (
    <TouchableOpacity
      onPress={() => selectedIds.size > 0 && setConfirmVisible(true)}
      disabled={selectedIds.size === 0}
    >
      <View style={[styles.trashBtn, selectedIds.size === 0 && { opacity: 0.3 }]}>
        <Ionicons name="trash-outline" size={20} color="#cc0000" />
        {selectedIds.size > 0 && (
          <View style={styles.trashBadge}>
            <Text style={styles.trashBadgeText}>{selectedIds.size}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ) : (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.viewToggle}
        onPress={() => setViewMode(v => v === "list" ? "grid" : "list")}
      >
        <View style={[styles.viewToggleSeg, viewMode === "grid" && styles.viewToggleSegActive]}>
          <Ionicons name="grid-outline" size={14} color={viewMode === "grid" ? "#fff" : "#555"} />
        </View>
        <View style={[styles.viewToggleSeg, viewMode === "list" && styles.viewToggleSegActive]}>
          <Ionicons name="list-outline" size={14} color={viewMode === "list" ? "#fff" : "#555"} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/create-player")}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}
```

- [ ] **Step 5: Add toggle and headerRight styles**

Add to `StyleSheet.create`:
```tsx
headerRight:        { flexDirection: "row", alignItems: "center", gap: 10 },
viewToggle:         { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
viewToggleSeg:      { padding: 5 },
viewToggleSegActive:{ backgroundColor: "rgba(255,255,255,0.18)" },
gridWrap:           { flexDirection: "row", flexWrap: "wrap", gap: 8 },
```

- [ ] **Step 6: Swap ScrollView content between list and grid**

Find the `<ScrollView>` (around line 728). Its current inner content is three JSX blocks:
1. `{mvpPlayer && ...}` — MVP card, **keep this unchanged**
2. `{sorted.length === 0 && ...}` — empty state
3. `{sorted.map(...)}` — player list

Replace blocks 2 and 3 with the following (leave the MVP card block untouched above):
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

{sorted.length > 0 && (selectMode || viewMode === "list") && sorted.map((player, index) => (
  <PlayerRow
    key={player.id}
    player={player}
    selectable={selectMode}
    selected={selectedIds.has(player.id)}
    onSelect={() => toggleSelect(player.id)}
    onTap={() => setCardPlayer(player)}
    isLast={index === sorted.length - 1}
  />
))}

{sorted.length > 0 && !selectMode && viewMode === "grid" && (
  <View style={styles.gridWrap}>
    {sorted.map(player => (
      <GridCard key={player.id} player={player} onTap={() => setCardPlayer(player)} />
    ))}
  </View>
)}
```

`selectMode` forces list view so checkboxes render correctly. The MVP card at the top renders in both list and grid modes.

- [ ] **Step 7: Verify and commit**

Run `npm start`:
- Default view is the rich list (attribute pills visible)
- Tap the grid icon → 3-column tier-gradient cards appear
- Tap back to list → list returns
- Enter select mode from ⋯ menu → list is always shown, toggle hidden
- Position tabs filter both views correctly

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: add grid/list toggle and GridCard to players tab"
```
