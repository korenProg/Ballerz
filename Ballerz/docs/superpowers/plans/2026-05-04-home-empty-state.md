# Home Empty State — Two Action Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single "No games yet" empty card with two side-by-side action cards — one active (Add Players) and one dimmed/locked (Create Game) — shown when the league has no players and no games.

**Architecture:** Single file edit in `app/(tabs)/index.tsx`. Replace the `emptyCard` JSX block and its 6 old StyleSheet entries with new `startSection` JSX and matching styles. The `LinearGradient` import is retained (still used for hero backgrounds).

**Tech Stack:** React Native, Expo, TypeScript, `@expo/vector-icons`

---

### Task 1: Replace empty state JSX and styles

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Replace the empty state JSX block**

Find lines 222–242 in `app/(tabs)/index.tsx` (the `gamesCount === 0 && players.length === 0` block) and replace with:

```tsx
{gamesCount === 0 && players.length === 0 && (
  <View style={s.startSection}>
    <Text style={s.sectionTitle}>GET STARTED</Text>
    <View style={s.startCards}>
      <TouchableOpacity
        style={s.startCard}
        activeOpacity={0.75}
        onPress={() => router.push("/(tabs)/players")}
      >
        <View style={[s.startIconWrap, s.startIconBlue]}>
          <Ionicons name="people" size={22} color="#60a5fa" />
        </View>
        <Text style={s.startCardTitle}>Add Players</Text>
        <Text style={s.startCardDesc}>Build your squad first</Text>
        <View style={s.startCardBtn}>
          <Text style={s.startCardBtnTxt}>Add Players</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.startCard, { opacity: 0.6 }]}
        activeOpacity={0.75}
        onPress={() => router.push("/(tabs)/players")}
      >
        <View style={[s.startIconWrap, s.startIconMuted]}>
          <Ionicons name="football" size={22} color={T.textMuted} />
        </View>
        <Text style={[s.startCardTitle, { color: T.textMuted }]}>Create Game</Text>
        <Text style={s.startCardDesc}>Add players first</Text>
        <View style={[s.startCardBtn, s.startCardBtnMuted]}>
          <Text style={[s.startCardBtnTxt, { color: T.textMuted }]}>Create Game</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
)}
```

- [ ] **Step 2: Replace the empty-state styles in StyleSheet.create**

Find the `// Empty state` comment block (lines 493–526) and replace the 6 old style entries (`emptyCard`, `emptyTitle`, `emptyText`, `emptyCtaWrap`, `emptyCta`, `emptyCtaTxt`) with:

```ts
// Empty state — get started
startSection: { marginHorizontal: 16, marginBottom: 20 },
startCards: { flexDirection: "row", gap: 10, marginTop: 10 },
startCard: {
  flex: 1,
  backgroundColor: T.surface,
  borderWidth: 1,
  borderColor: T.border,
  borderRadius: T.radius.card,
  padding: 16,
},
startIconWrap: {
  width: 38,
  height: 38,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 8,
},
startIconBlue:  { backgroundColor: "rgba(96,165,250,0.12)" },
startIconMuted: { backgroundColor: "rgba(255,255,255,0.06)" },
startCardTitle: { color: T.textPrimary, fontSize: 13, fontWeight: "800", marginBottom: 4 },
startCardDesc:  { color: T.textMuted, fontSize: 11, marginBottom: 10 },
startCardBtn: {
  backgroundColor: T.accent,
  borderRadius: T.radius.pill,
  paddingVertical: 9,
  alignItems: "center",
},
startCardBtnMuted: {
  backgroundColor: "rgba(255,255,255,0.07)",
  borderWidth: 1,
  borderColor: T.border,
},
startCardBtnTxt: { color: "#000", fontSize: 11, fontWeight: "800" },
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: 0 errors. The 8 pre-existing warnings in `games.tsx` and `players.tsx` may still appear — that's fine.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: replace empty state with two action cards"
```
