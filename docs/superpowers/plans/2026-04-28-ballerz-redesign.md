# Ballerz Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual and functional redesign — deep-space dark UI with glassmorphism cards, simplified game recording (no live tracker), real-data stats with rivalry card and hexagonal radar chart, and edit-player support.

**Architecture:** Full rewrite of all 5 tab screens and supporting infrastructure in one pass. A central `constants/theme.ts` provides all design tokens. A new `app/record-result.tsx` stack screen replaces the live tracker. `react-native-svg` powers the radar chart.

**Tech Stack:** React Native 0.81 · Expo Router v6 · Zustand v5 · expo-linear-gradient · react-native-svg (new) · @expo/vector-icons (Ionicons) · react-native-safe-area-context

**Design constraints:**
- No emojis anywhere — use Ionicons exclusively
- No team-color glows on cards
- Score text: 28px weight 900
- Background: `#07080f` (not pure black)
- Amber accent `#f59e0b` on CTAs, date badges, MVP labels only

---

### Task 1: Replace design tokens in `constants/theme.ts`

**Files:**
- Modify: `constants/theme.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
export const T = {
  bg: "#07080f",
  surface: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  accent: "#f59e0b",
  accentMuted: "rgba(245,158,11,0.12)",
  accentBorder: "rgba(245,158,11,0.2)",
  textPrimary: "#ffffff",
  textSecondary: "#c8ccd8",
  textMuted: "#3a3d52",
  scoreSize: 28,
  radius: { card: 22, pill: 14, badge: 8 },
} as const;
```

Keep the existing `Colors` and `Fonts` exports below it — they may be referenced by Expo internals. Just prepend the `T` export at the top.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: add design token object T to theme"
```

---

### Task 2: Simplify `types/games.ts`

**Files:**
- Modify: `types/games.ts`

The `GoalEvent` type and `goalEvents` field are no longer needed. `Live` status will no longer be created (keep it in the union so old persisted data renders without crashing — new UI treats it the same as `Pending`).

- [ ] **Step 1: Remove `GoalEvent` and `goalEvents`, keep everything else**

```typescript
export type GamePlayer = {
  id: string;
  name: string;
  position: string;
};

export type Game = {
  id: string;
  date?: string;
  league: string;
  status: "FT" | "Live" | "Pending";
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  mvp: { name: string; stat: string };
  homeColor: string;
  awayColor: string;
  location?: string;
  homePlayers?: GamePlayer[];
  awayPlayers?: GamePlayer[];
};

export type ExportMode = "options" | "result" | "preview" | "teamsheet";
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: errors only in `games.tsx` where `GoalEvent` / `goalEvents` is referenced — those will be fixed when that screen is rewritten in Task 6.

- [ ] **Step 3: Commit**

```bash
git add types/games.ts
git commit -m "feat: remove GoalEvent type from game model"
```

---

### Task 3: Add rivalry and radar selectors to `store/selectors.ts`

**Files:**
- Modify: `store/selectors.ts`

These are pure derivations from store state. The rivalry selector finds the most-played matchup (case-insensitive team name match, either order). The radar selector returns per-team average stats for the most recent FT game.

- [ ] **Step 1: Add selectors**

```typescript
import { useShallow } from "zustand/react/shallow";
import { useStore } from "./index";
import type { Player } from "../types/players";

export const useLastGame = () =>
  useStore((s) => {
    const finished = s.games.filter((g) => g.status === "FT");
    if (!finished.length) return null;
    return finished.reduce((latest, g) =>
      new Date(g.date ?? 0) > new Date(latest.date ?? 0) ? g : latest
    );
  });

export const useMvpPlayer = () =>
  useStore((s) => s.players.find((p) => p.isMvp) ?? null);

export const useAppStats = () =>
  useStore(
    useShallow((s) => ({
      gamesCount: s.games.length,
      playersCount: s.players.length,
      totalGoals: s.games.reduce(
        (sum, g) => sum + (g.homeScore ?? 0) + (g.awayScore ?? 0),
        0
      ),
    }))
  );

const normalizeTeamKey = (a: string, b: string) =>
  [a, b].map((t) => t.toLowerCase().trim()).sort().join("||");

export const useRivalry = () =>
  useStore(
    useShallow((s) => {
      // Count games per unique matchup (order-insensitive)
      const counts: Record<string, { home: string; away: string; count: number; homeWins: number; awayWins: number; draws: number; lastGame: typeof s.games[0] | null }> = {};
      s.games.filter((g) => g.status === "FT").forEach((g) => {
        const key = normalizeTeamKey(g.homeTeam, g.awayTeam);
        if (!counts[key]) {
          counts[key] = { home: g.homeTeam, away: g.awayTeam, count: 0, homeWins: 0, awayWins: 0, draws: 0, lastGame: null };
        }
        const entry = counts[key];
        entry.count++;
        if (g.homeScore > g.awayScore) entry.homeWins++;
        else if (g.awayScore > g.homeScore) entry.awayWins++;
        else entry.draws++;
        const gDate = new Date(g.date ?? 0).getTime();
        const lDate = new Date(entry.lastGame?.date ?? 0).getTime();
        if (gDate > lDate) entry.lastGame = g;
      });
      const best = Object.values(counts).sort((a, b) => b.count - a.count)[0];
      if (!best || best.count < 2) return null;
      return best;
    })
  );

type RadarTeam = { label: string; color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };

const avg = (vals: number[]) =>
  vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;

export const useLastGameRadar = (): { home: RadarTeam; away: RadarTeam } | null =>
  useStore(
    useShallow((s) => {
      const last = s.games.filter((g) => g.status === "FT").sort((a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
      )[0];
      if (!last) return null;

      const playerMap = new Map<string, Player>(s.players.map((p) => [p.id, p]));

      const stats = (ids: string[]) => {
        const ps = ids.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
        return {
          pac: avg(ps.map((p) => p.pac)),
          sho: avg(ps.map((p) => p.sho)),
          pas: avg(ps.map((p) => p.pas)),
          dri: avg(ps.map((p) => p.dri)),
          def: avg(ps.map((p) => p.def)),
          phy: avg(ps.map((p) => p.phy)),
        };
      };

      const homeIds = (last.homePlayers ?? []).map((p) => p.id);
      const awayIds = (last.awayPlayers ?? []).map((p) => p.id);

      return {
        home: { label: last.homeTeam, color: last.homeColor, ...stats(homeIds) },
        away: { label: last.awayTeam, color: last.awayColor, ...stats(awayIds) },
      };
    })
  );
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add store/selectors.ts
git commit -m "feat: add rivalry and radar selectors"
```

---

### Task 4: Create `app/record-result.tsx` and register it in `app/_layout.tsx`

**Files:**
- Create: `app/record-result.tsx`
- Modify: `app/_layout.tsx`

This screen receives `gameId` as a search param. It shows two large score inputs and a player picker for MVP. It calls `updateGame` and `setMvp` on save, then navigates back.

- [ ] **Step 1: Register the screen in `app/_layout.tsx`**

Add this `<Stack.Screen>` inside the `<Stack>`, after the existing `create-game` entry:

```tsx
<Stack.Screen
  name="record-result"
  options={{ presentation: 'modal', headerShown: false }}
/>
```

- [ ] **Step 2: Create `app/record-result.tsx`**

```tsx
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useStore } from "../store";
import { T } from "../constants/theme";

export default function RecordResultScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const { games, players, updateGame, setMvp } = useStore();
  const game = games.find((g) => g.id === gameId);

  const [homeScore, setHomeScore] = useState(
    game?.status === "FT" ? String(game.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    game?.status === "FT" ? String(game.awayScore) : ""
  );
  const [mvpId, setMvpId] = useState<string | null>(null);

  if (!game) return null;

  const allPlayerIds = [
    ...(game.homePlayers ?? []).map((p) => p.id),
    ...(game.awayPlayers ?? []).map((p) => p.id),
  ];
  const gamePlayers = allPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as typeof players;

  const handleSave = () => {
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as_)) return;

    const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
    updateGame(game.id, {
      status: "FT",
      homeScore: hs,
      awayScore: as_,
      mvp: { name: mvpPlayer?.name ?? "—", stat: "" },
    });
    if (mvpId) setMvp(mvpId);
    router.back();
  };

  const canSave = homeScore !== "" && awayScore !== "" &&
    !isNaN(parseInt(homeScore, 10)) && !isNaN(parseInt(awayScore, 10));

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <Ionicons name="chevron-down" size={22} color={T.textSecondary} />
          </TouchableOpacity>
          <Text style={s.title}>Record Result</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Teams + score inputs */}
          <View style={s.scoreRow}>
            <View style={s.teamSide}>
              <View style={[s.teamDot, { backgroundColor: game.homeColor }]} />
              <Text style={s.teamName} numberOfLines={2}>{game.homeTeam}</Text>
              <TextInput
                style={s.scoreInput}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={T.textMuted}
                selectionColor={T.accent}
              />
            </View>

            <Text style={s.vs}>–</Text>

            <View style={[s.teamSide, { alignItems: "flex-end" }]}>
              <View style={[s.teamDot, { backgroundColor: game.awayColor }]} />
              <Text style={[s.teamName, { textAlign: "right" }]} numberOfLines={2}>
                {game.awayTeam}
              </Text>
              <TextInput
                style={[s.scoreInput, { textAlign: "right" }]}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={T.textMuted}
                selectionColor={T.accent}
              />
            </View>
          </View>

          {/* MVP picker */}
          <Text style={s.sectionLabel}>MVP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.mvpScroll}>
            {gamePlayers.map((p) => {
              const selected = mvpId === p.id;
              const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setMvpId(selected ? null : p.id)}
                  style={[s.mvpChip, selected && s.mvpChipSelected]}
                  activeOpacity={0.7}
                >
                  <View style={[s.mvpAvatar, selected && { borderColor: T.accent }]}>
                    <Text style={[s.mvpInitials, selected && { color: T.accent }]}>{initials}</Text>
                  </View>
                  <Text style={[s.mvpName, selected && { color: T.accent }]} numberOfLines={1}>
                    {p.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ScrollView>

        {/* Save button */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={20} color="#000" />
            <Text style={s.saveBtnText}>Save Result</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: T.bg },
  header:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  closeBtn:{ width: 38, height: 38, borderRadius: 12, backgroundColor: T.surface, alignItems: "center", justifyContent: "center" },
  title:   { color: T.textPrimary, fontSize: 17, fontWeight: "800" },

  content: { paddingHorizontal: 16, paddingBottom: 20 },

  scoreRow:  { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 32 },
  teamSide:  { flex: 1, alignItems: "flex-start" },
  teamDot:   { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  teamName:  { color: T.textSecondary, fontSize: 13, fontWeight: "700", marginBottom: 16, minHeight: 36 },
  scoreInput:{
    color: T.textPrimary, fontSize: 56, fontWeight: "900", letterSpacing: -2,
    borderBottomWidth: 1.5, borderBottomColor: T.border, minWidth: 60, paddingBottom: 4,
  },
  vs: { color: T.textMuted, fontSize: 32, fontWeight: "300", paddingHorizontal: 16, paddingTop: 40 },

  sectionLabel: { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  mvpScroll:    { gap: 10, paddingRight: 16 },
  mvpChip:      { alignItems: "center", gap: 6, width: 60 },
  mvpChipSelected: {},
  mvpAvatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border, alignItems: "center", justifyContent: "center" },
  mvpInitials:  { color: T.textSecondary, fontSize: 14, fontWeight: "800" },
  mvpName:      { color: T.textMuted, fontSize: 11, fontWeight: "600", textAlign: "center" },

  footer:       { paddingHorizontal: 16, paddingBottom: 8 },
  saveBtn:      { backgroundColor: T.accent, borderRadius: T.radius.pill, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnText:  { color: "#000", fontSize: 16, fontWeight: "800" },
});
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Manual test**

Start the app (`npx expo start`). Navigate to the Games tab, tap a completed game card, verify the Record Result screen opens pre-filled with the existing score.

- [ ] **Step 5: Commit**

```bash
git add app/record-result.tsx app/_layout.tsx
git commit -m "feat: add record-result screen for score entry"
```

---

### Task 5: Redesign `app/(tabs)/index.tsx` (Home tab)

**Files:**
- Modify: `app/(tabs)/index.tsx`

Remove the season badge. Replace the blue CTA with an amber gradient one. Apply new typography and card surface styles. Remove the MVP hero card section (too much vertical space; MVP is shown inside the last match card). No emojis.

- [ ] **Step 1: Replace the entire file**

```tsx
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Redirect, useRouter } from "expo-router";
import { useStore } from "../../store";
import { useLastGame, useAppStats } from "../../store/selectors";
import { T } from "../../constants/theme";
import type { Game } from "../../types/games";

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={s.statPill}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function LastMatchCard({ g }: { g: Game }) {
  const isCompleted = g.status === "FT";
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.leagueRow}>
          <Ionicons name="football-outline" size={11} color={T.textMuted} />
          <Text style={s.leagueTxt}>{g.league}</Text>
        </View>
        <View style={s.ftPill}>
          <Text style={s.ftTxt}>FT</Text>
        </View>
      </View>

      <View style={s.scoreRow}>
        <View style={s.teamSide}>
          <View style={[s.teamDot, { backgroundColor: g.homeColor }]} />
          <Text style={s.teamName}>{g.homeTeam}</Text>
        </View>
        <Text style={s.scoreText}>
          {isCompleted ? `${g.homeScore}` : "–"}
          <Text style={s.scoreSep}> – </Text>
          {isCompleted ? `${g.awayScore}` : "–"}
        </Text>
        <View style={[s.teamSide, { alignItems: "flex-end" }]}>
          <View style={[s.teamDot, { backgroundColor: g.awayColor }]} />
          <Text style={[s.teamName, { textAlign: "right" }]}>{g.awayTeam}</Text>
        </View>
      </View>

      {g.mvp.name !== "—" && (
        <View style={s.cardFooter}>
          <View style={s.mvpRow}>
            <View style={s.mvpBadge}>
              <Text style={s.mvpBadgeTxt}>MVP</Text>
            </View>
            <Text style={s.mvpNameTxt}>{g.mvp.name}</Text>
          </View>
          {g.location ? (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={10} color={T.textMuted} />
              <Text style={s.locationTxt}>{g.location}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function UpcomingCard({ g }: { g: Game }) {
  return (
    <View style={[s.card, s.upcomingCard]}>
      <View style={s.cardTop}>
        <Text style={s.sectionEyebrow}>UPCOMING</Text>
        {g.date ? (
          <View style={s.dateBadge}>
            <Text style={s.dateBadgeTxt}>{g.date}</Text>
          </View>
        ) : null}
      </View>
      <View style={s.upcomingTeams}>
        <Text style={s.upcomingTeamName}>{g.homeTeam}</Text>
        <Text style={s.upcomingVs}>vs</Text>
        <Text style={[s.upcomingTeamName, { textAlign: "right" }]}>{g.awayTeam}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const lastGame = useLastGame();
  const { gamesCount, playersCount, totalGoals } = useAppStats();
  const games = useStore((s) => s.games);
  const nextGame = games.find((g) => g.status === "Pending") ?? null;

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>BALLER<Text style={s.logoAccent}>Z</Text></Text>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push("/create-game")}>
            <Ionicons name="add" size={20} color={T.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={s.statsRow}>
          <StatPill value={String(gamesCount)}   label="GAMES"   color="#60a5fa" />
          <StatPill value={String(playersCount)}  label="PLAYERS" color="#a78bfa" />
          <StatPill value={String(totalGoals)}    label="GOALS"   color={T.accent} />
        </View>

        {/* Last match */}
        {lastGame && (
          <>
            <Text style={[s.sectionEyebrow, { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }]}>
              LAST RESULT
            </Text>
            <LastMatchCard g={lastGame} />
          </>
        )}

        {/* Upcoming */}
        {nextGame && (
          <>
            <Text style={[s.sectionEyebrow, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }]}>
              UPCOMING
            </Text>
            <UpcomingCard g={nextGame} />
          </>
        )}

        {/* CTA */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/create-game")} style={s.ctaWrap}>
          <LinearGradient colors={["#f59e0b", "#d97706"]} style={s.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={s.ctaTxt}>Create Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  content:{ paddingBottom: 16 },

  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  logo:      { color: T.textPrimary, fontSize: 22, fontWeight: "900", letterSpacing: -1 },
  logoAccent:{ color: T.accent },
  headerBtn: { width: 36, height: 36, borderRadius: T.radius.badge, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center" },

  statsRow:  { flexDirection: "row", marginHorizontal: 16, gap: 8 },
  statPill:  { flex: 1, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: T.radius.pill, paddingVertical: 14, alignItems: "center" },
  statVal:   { fontSize: 22, fontWeight: "800" },
  statLbl:   { fontSize: 8, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },

  sectionEyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 2, color: T.textMuted, textTransform: "uppercase" },

  card:       { marginHorizontal: 16, backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 14 },
  upcomingCard:{ marginTop: 0 },
  cardTop:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  leagueRow:  { flexDirection: "row", alignItems: "center", gap: 5 },
  leagueTxt:  { color: T.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  ftPill:     { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ftTxt:      { color: T.textMuted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },

  scoreRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  teamSide:   { flex: 1 },
  teamDot:    { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  teamName:   { color: T.textSecondary, fontSize: 13, fontWeight: "700" },
  scoreText:  { color: T.textPrimary, fontSize: T.scoreSize, fontWeight: "900", letterSpacing: -1 },
  scoreSep:   { color: T.textMuted, fontWeight: "300" },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  mvpRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  mvpBadge:   { backgroundColor: T.accentMuted, borderWidth: 1, borderColor: T.accentBorder, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  mvpBadgeTxt:{ color: T.accent, fontSize: 9, fontWeight: "800" },
  mvpNameTxt: { color: T.textSecondary, fontSize: 12, fontWeight: "700" },
  locationRow:{ flexDirection: "row", alignItems: "center", gap: 4 },
  locationTxt:{ color: T.textMuted, fontSize: 10 },

  dateBadge:       { backgroundColor: T.accentMuted, borderWidth: 1, borderColor: T.accentBorder, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dateBadgeTxt:    { color: T.accent, fontSize: 9, fontWeight: "800" },
  upcomingTeams:   { flexDirection: "row", alignItems: "center" },
  upcomingTeamName:{ flex: 1, color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  upcomingVs:      { color: T.textMuted, fontSize: 11, fontWeight: "700", paddingHorizontal: 12 },

  ctaWrap: { marginHorizontal: 16, marginTop: 20, borderRadius: T.radius.pill, overflow: "hidden" },
  cta:     { paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaTxt:  { color: "#000", fontSize: 15, fontWeight: "800" },
});
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual test**

Open the Home tab. Verify: amber Z in logo, glass stat pills, last match card with MVP badge, amber CTA button, no emojis.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: redesign home tab with new visual system"
```

---

### Task 6: Redesign `app/(tabs)/games.tsx`

**Files:**
- Modify: `app/(tabs)/games.tsx`

Remove `LiveTrackerModal`, `PlayerScoreRow`, `MvpPickerSheet`, all `GoalEvent`/`goalEvents` usage. Remove `Live` from filter tabs. Tapping a completed game card navigates to `record-result`. Keep the `GameExportSheet` (share functionality) unchanged. Keep filter tabs and select/delete mode.

- [ ] **Step 1: Replace the file**

The key structural changes from the existing file:
1. Remove imports: `GoalEvent`, `captureRef`, all tracker-related state
2. Remove components: `LiveTrackerModal`, `PlayerScoreRow`, `MvpPickerSheet`, `LiveDot`
3. Update `FilterKey` type: remove `"Live"` → `type FilterKey = "All" | "Upcoming" | "FT"`
4. Update `GameCard`: treat `"Live"` same as `"Pending"` in display; make FT cards tappable → navigate to record-result
5. Apply new background color `T.bg` and card styles

The file is large; write the new version keeping all existing export logic intact. Here is the complete replacement:

```tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated, Modal, ScrollView, Share, StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { useRouter } from "expo-router";
import { GamePlayer, Game, ExportMode } from "../../types";
import { useStore } from "../../store";
import { T } from "../../constants/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildShareText(game: Game, mode: "result" | "preview" | "teamsheet"): string {
  if (mode === "result") {
    const winner = game.homeScore > game.awayScore ? game.homeTeam
      : game.awayScore > game.homeScore ? game.awayTeam : "Draw";
    return [
      `BALLERZ - ${game.league}`,
      `${game.homeTeam}  ${game.homeScore} - ${game.awayScore}  ${game.awayTeam}`,
      winner !== "Draw" ? `${winner} win!` : `Draw`,
      game.mvp.name !== "—" ? `MVP: ${game.mvp.name}` : "",
      game.location ? `${game.location}` : "",
      `via Ballerz`,
    ].filter(Boolean).join("\n");
  }
  if (mode === "preview") {
    return [
      `TONIGHT'S MATCH`,
      `${game.homeTeam}  vs  ${game.awayTeam}`,
      game.location ? `${game.location}` : "",
      `via Ballerz`,
    ].filter(Boolean).join("\n");
  }
  const homeList = (game.homePlayers || []).map((p) => `  ${p.name.padEnd(20)} ${p.position}`).join("\n");
  const awayList = (game.awayPlayers || []).map((p) => `  ${p.name.padEnd(20)} ${p.position}`).join("\n");
  return [`TEAM SHEET`, `${game.homeTeam} vs ${game.awayTeam}`,
    game.homeTeam.toUpperCase(), homeList,
    game.awayTeam.toUpperCase(), awayList,
    `via Ballerz`].filter(Boolean).join("\n");
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type FilterKey = "All" | "Upcoming" | "FT";
const FILTERS: FilterKey[] = ["All", "Upcoming", "FT"];

function FilterTabs({ active, onChange, counts }: {
  active: FilterKey; onChange: (f: FilterKey) => void; counts: Record<FilterKey, number>;
}) {
  return (
    <View style={ft.bar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ft.content}>
        {FILTERS.map((f) => {
          const isActive = f === active;
          return (
            <TouchableOpacity key={f} onPress={() => onChange(f)} activeOpacity={0.75}
              style={[ft.pill, isActive && ft.pillActive]}>
              <Text style={[ft.label, isActive && ft.labelActive]}>{f}</Text>
              {counts[f] > 0 && (
                <View style={[ft.badge, isActive && ft.badgeActive]}>
                  <Text style={[ft.badgeTxt, isActive && ft.badgeTxtActive]}>{counts[f]}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const ft = StyleSheet.create({
  bar: { height: 48, justifyContent: "center" },
  content: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  pillActive: { backgroundColor: T.accent, borderColor: T.accent },
  label: { color: T.textMuted, fontSize: 13, fontWeight: "700" },
  labelActive: { color: "#000" },
  badge: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeActive: { backgroundColor: "rgba(0,0,0,0.15)" },
  badgeTxt: { color: T.textMuted, fontSize: 10, fontWeight: "800" },
  badgeTxtActive: { color: "#000cc" },
});

// ─── Export Cards (unchanged from original) ───────────────────────────────────

const EXP_W = 320;

function TeamColorBar({ homeColor, awayColor }: { homeColor: string; awayColor: string }) {
  return (
    <View style={{ flexDirection: "row", height: 3 }}>
      <View style={{ flex: 1, backgroundColor: homeColor }} />
      <View style={{ flex: 1, backgroundColor: awayColor }} />
    </View>
  );
}

function ResultExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  const isDraw = game.homeScore === game.awayScore;
  const winnerColor = game.homeScore > game.awayScore ? game.homeColor
    : game.awayScore > game.homeScore ? game.awayColor : "#666";
  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={expCard.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football" size={11} color="#444" />
          <Text style={expCard.headerLeague}>{game.league}</Text>
        </View>
        <View style={expCard.ftBadge}><Text style={expCard.ftText}>FULL TIME</Text></View>
      </View>
      <View style={expCard.scoreRow}>
        <View style={expCard.teamCol}>
          <View style={[expCard.shield, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <View style={expCard.scoreBlock}>
          <Text style={expCard.scoreText}>{game.homeScore}–{game.awayScore}</Text>
          {!isDraw ? (
            <View style={[expCard.resultPill, { borderColor: winnerColor + "40", backgroundColor: winnerColor + "14" }]}>
              <Text style={[expCard.resultPillTxt, { color: winnerColor }]}>
                {game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam} win
              </Text>
            </View>
          ) : (
            <View style={[expCard.resultPill, { borderColor: "#44444466", backgroundColor: "#1a1a1a" }]}>
              <Text style={[expCard.resultPillTxt, { color: "#888" }]}>Draw</Text>
            </View>
          )}
        </View>
        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View style={[expCard.shield, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={22} color={game.awayColor} />
          </View>
          <Text style={[expCard.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
        </View>
      </View>
      {game.location && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: -6, marginBottom: 12 }}>
          <Ionicons name="location-outline" size={10} color="#444" />
          <Text style={{ color: "#444", fontSize: 10, fontWeight: "500" }}>{game.location}</Text>
        </View>
      )}
      {game.mvp.name !== "—" && (
        <>
          <View style={expCard.divider} />
          <View style={expCard.mvpRow}>
            <Ionicons name="star" size={13} color="#f5c518" />
            <Text style={expCard.mvpLabel}>MVP</Text>
            <Text style={expCard.mvpName}>{game.mvp.name}</Text>
          </View>
        </>
      )}
      <View style={[expCard.divider, { marginTop: 4 }]} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function PreviewExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="football-outline" size={11} color="#444" />
          <Text style={{ color: "#555", fontSize: 11, fontWeight: "600" }}>{game.league}</Text>
        </View>
      </View>
      <View style={[expCard.scoreRow, { paddingVertical: 14 }]}>
        <View style={expCard.teamCol}>
          <View style={[expCard.shieldLg, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.homeColor} />
          </View>
          <Text style={expCard.teamName} numberOfLines={2}>{game.homeTeam}</Text>
        </View>
        <Text style={expCard.vsText}>vs</Text>
        <View style={[expCard.teamCol, { alignItems: "flex-end" }]}>
          <View style={[expCard.shieldLg, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
            <Ionicons name="shield" size={28} color={game.awayColor} />
          </View>
          <Text style={[expCard.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
        </View>
      </View>
      {game.location && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Ionicons name="location-outline" size={11} color="#555" />
            <Text style={{ color: "#666", fontSize: 11, fontWeight: "600" }}>{game.location}</Text>
          </View>
        </View>
      )}
      <View style={expCard.divider} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

function TeamSheetExportCard({ game, cardRef }: { game: Game; cardRef: React.RefObject<View | null> }) {
  const home = game.homePlayers || [];
  const away = game.awayPlayers || [];
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View ref={cardRef} collapsable={false} style={expCard.wrap}>
      <TeamColorBar homeColor={game.homeColor} awayColor={game.awayColor} />
      <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 12 }}>
        <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", letterSpacing: 2.5, marginBottom: 5 }}>TEAM SHEET</Text>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>{game.homeTeam} vs {game.awayTeam}</Text>
      </View>
      <View style={expCard.divider} />
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 14, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: game.homeColor }} />
            <Text style={{ color: game.homeColor, fontSize: 10, fontWeight: "800", flex: 1 }} numberOfLines={1}>{game.homeTeam}</Text>
          </View>
          {home.map((p) => (
            <View key={p.id} style={expCard.playerRow}>
              <View style={[expCard.miniAvatar, { borderColor: game.homeColor + "44" }]}>
                <Text style={[expCard.miniAvatarTxt, { color: game.homeColor }]}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ width: 1, backgroundColor: "#1e1e1e", marginTop: 30 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, marginBottom: 10 }}>
            <Text style={{ color: game.awayColor, fontSize: 10, fontWeight: "800" }} numberOfLines={1}>{game.awayTeam}</Text>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: game.awayColor }} />
          </View>
          {away.map((p) => (
            <View key={p.id} style={[expCard.playerRow, { flexDirection: "row-reverse" }]}>
              <View style={[expCard.miniAvatar, { borderColor: game.awayColor + "44" }]}>
                <Text style={[expCard.miniAvatarTxt, { color: game.awayColor }]}>{initials(p.name)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
                <Text style={expCard.playerRowName} numberOfLines={1}>{p.name.split(" ").pop()}</Text>
                <Text style={expCard.playerRowPos}>{p.position}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={expCard.divider} />
      <Text style={expCard.watermark}>VIA BALLERZ</Text>
    </View>
  );
}

const expCard = StyleSheet.create({
  wrap: { width: EXP_W, backgroundColor: "#0c0c0c", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1e1e1e" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  headerLeague: { color: "#555", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  ftBadge: { backgroundColor: "#252525", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  ftText: { color: "#aaa", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 18, gap: 6 },
  teamCol: { flex: 1, alignItems: "center", gap: 7 },
  shield: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  shieldLg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  teamName: { color: "#fff", fontSize: 11, fontWeight: "800", textAlign: "center" },
  scoreBlock: { alignItems: "center", gap: 7, paddingHorizontal: 4 },
  scoreText: { color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  resultPill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  resultPillTxt: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  vsText: { color: "#333", fontSize: 22, fontWeight: "200", paddingHorizontal: 4 },
  divider: { height: 1, backgroundColor: "#161616" },
  mvpRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  mvpLabel: { color: "#555", fontSize: 10, fontWeight: "700" },
  mvpName: { color: "#fff", fontSize: 11, fontWeight: "800", flex: 1 },
  watermark: { textAlign: "center", color: "#222", fontSize: 9, fontWeight: "800", letterSpacing: 2, paddingVertical: 9 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  miniAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#111", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  miniAvatarTxt: { fontSize: 8, fontWeight: "800" },
  playerRowName: { color: "#ddd", fontSize: 11, fontWeight: "700" },
  playerRowPos: { color: "#3a3a3a", fontSize: 9, marginTop: 1 },
});

// ─── Game Export Sheet ────────────────────────────────────────────────────────

function GameExportSheet({ game, visible, onClose }: { game: Game | null; visible: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<ExportMode>("options");
  const [sharing, setSharing] = useState(false);
  const sheetY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cardRef = useRef<View | null>(null);

  React.useEffect(() => {
    if (visible) {
      setMode("options");
      sheetY.setValue(80); opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 60, duration: 150, useNativeDriver: true }),
    ]).start(onClose);
  };

  const handleShare = async () => {
    if (mode === "options" || !game) return;
    setSharing(true);
    try {
      if (cardRef.current) {
        const uri = await captureRef(cardRef, { format: "png", quality: 1 });
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
    } catch {
      await Share.share({ message: buildShareText(game, mode as "result" | "preview" | "teamsheet") });
    } finally { setSharing(false); }
  };

  if (!game) return null;
  const hasPlayers = !!(game.homePlayers?.length && game.awayPlayers?.length);
  const OPTION_CONFIGS = [
    { key: "result" as const, show: game.status === "FT", icon: "trophy-outline" as const, iconBg: "#1a0800", iconClr: "#cc4400", title: "Game Result", sub: "Final score + MVP" },
    { key: "preview" as const, show: true, icon: "radio-outline" as const, iconBg: "#00091a", iconClr: "#2266ee", title: "Match Preview", sub: "Announce the upcoming matchup" },
    { key: "teamsheet" as const, show: hasPlayers, icon: "people-outline" as const, iconBg: "#001510", iconClr: "#00aa66", title: "Team Sheet", sub: "Tonight's lineups" },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <BlurView intensity={45} tint="dark" style={exp.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
        <Animated.View style={[exp.sheet, { opacity, transform: [{ translateY: sheetY }] }]}>
          <View style={exp.handle} />
          {mode === "options" ? (
            <>
              <Text style={exp.title}>Share</Text>
              <Text style={exp.sub}>{game.homeTeam} vs {game.awayTeam}</Text>
              <View style={exp.divider} />
              {OPTION_CONFIGS.filter((o) => o.show).map((opt, i, arr) => (
                <React.Fragment key={opt.key}>
                  <TouchableOpacity style={exp.option} onPress={() => setMode(opt.key)} activeOpacity={0.7}>
                    <View style={[exp.optIcon, { backgroundColor: opt.iconBg }]}>
                      <Ionicons name={opt.icon} size={20} color={opt.iconClr} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={exp.optTitle}>{opt.title}</Text>
                      <Text style={exp.optSub}>{opt.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#2a2a2a" />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={exp.optDivider} />}
                </React.Fragment>
              ))}
              <View style={exp.divider} />
              <TouchableOpacity style={exp.cancelBtn} onPress={handleClose}>
                <Text style={exp.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={exp.previewHeader}>
                <TouchableOpacity style={exp.backBtn} onPress={() => setMode("options")}>
                  <Ionicons name="chevron-back" size={17} color="#aaa" />
                  <Text style={exp.backTxt}>Back</Text>
                </TouchableOpacity>
                <Text style={exp.previewTitle}>
                  {mode === "result" ? "Game Result" : mode === "preview" ? "Match Preview" : "Team Sheet"}
                </Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {mode === "result" && <ResultExportCard game={game} cardRef={cardRef} />}
                {mode === "preview" && <PreviewExportCard game={game} cardRef={cardRef} />}
                {mode === "teamsheet" && <TeamSheetExportCard game={game} cardRef={cardRef} />}
              </ScrollView>
              <View style={exp.divider} />
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <TouchableOpacity style={[exp.shareBtn, sharing && { opacity: 0.55 }]} onPress={handleShare} disabled={sharing} activeOpacity={0.85}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={exp.shareBtnTxt}>{sharing ? "Sharing…" : "Share Image"}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const exp = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#161616", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 10, paddingBottom: 34, overflow: "hidden" },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2a2a2a", alignSelf: "center", marginBottom: 14 },
  title: { color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 3 },
  sub: { color: "#555", fontSize: 13, textAlign: "center", marginBottom: 14 },
  divider: { height: 1, backgroundColor: "#1e1e1e" },
  option: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 15, gap: 14 },
  optIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  optSub: { color: "#444", fontSize: 12, marginTop: 2 },
  optDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 18 },
  cancelBtn: { paddingVertical: 16, alignItems: "center" },
  cancelTxt: { color: "#555", fontSize: 15, fontWeight: "600" },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 3, width: 60 },
  backTxt: { color: "#aaa", fontSize: 14, fontWeight: "600" },
  previewTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  shareBtn: { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  shareBtnTxt: { color: "#000", fontSize: 16, fontWeight: "800" },
});

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ visible, count, onConfirm, onCancel }: { visible: boolean; count: number; onConfirm: () => void; onCancel: () => void }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (visible) {
      scale.setValue(0.9); opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
      ]).start();
    } else { scale.setValue(0.9); opacity.setValue(0); }
  }, [visible]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <BlurView intensity={30} tint="dark" style={styles.dialogOverlay}>
        <Animated.View style={[styles.dialog, { opacity, transform: [{ scale }] }]}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="trash-outline" size={28} color="#cc0000" />
          </View>
          <Text style={styles.dialogTitle}>Delete {count} {count === 1 ? "Game" : "Games"}?</Text>
          <Text style={styles.dialogSubtitle}>This action cannot be undone.</Text>
          <View style={styles.dialogDivider} />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogCancel} onPress={onCancel}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.dialogActionsDivider} />
            <TouchableOpacity style={styles.dialogConfirm} onPress={onConfirm}>
              <Text style={styles.dialogConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({ game, selectable, selected, onSelect, onTap, onExport }: {
  game: Game; selectable: boolean; selected: boolean;
  onSelect: () => void; onTap: () => void; onExport: () => void;
}) {
  const isCompleted = game.status === "FT";
  const isPending = game.status !== "FT";

  return (
    <TouchableOpacity
      activeOpacity={selectable || isCompleted ? 0.7 : 1}
      onPress={selectable ? onSelect : isCompleted ? onTap : undefined}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.cardHeader}>
        {selectable && (
          <View style={styles.checkbox}>
            {selected
              ? <Ionicons name="checkmark-circle" size={20} color={T.accent} />
              : <Ionicons name="ellipse-outline" size={20} color="#333" />}
          </View>
        )}
        <View style={styles.cardHeaderMeta}>
          <Ionicons name="football-outline" size={12} color={T.textMuted} />
          <Text style={styles.leagueText}>{game.league}</Text>
          {game.location && (
            <>
              <Text style={styles.dotSep}>·</Text>
              <Text style={styles.locationText} numberOfLines={1}>{game.location}</Text>
            </>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isCompleted ? "rgba(255,255,255,0.06)" : T.accentMuted }]}>
          <Text style={[styles.statusText, { color: isCompleted ? T.textMuted : T.accent }]}>
            {isCompleted ? "FT" : "UPCOMING"}
          </Text>
        </View>
        {!selectable && (
          <TouchableOpacity onPress={onExport} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.shareIconBtn}>
            <Ionicons name="share-outline" size={15} color={T.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.scoreRow}>
        <View style={styles.teamBlock}>
          <View style={styles.teamNameRow}>
            <View style={[styles.teamCircle, { borderColor: game.homeColor, backgroundColor: game.homeColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.homeColor} />
            </View>
            <Text style={styles.teamName} numberOfLines={2}>{game.homeTeam}</Text>
          </View>
        </View>

        <View style={styles.scoreCenter}>
          {isPending ? (
            <Text style={styles.vsText}>VS</Text>
          ) : (
            <>
              <Text style={styles.scoreNum}>{game.homeScore}</Text>
              <Text style={styles.scoreSep}>–</Text>
              <Text style={styles.scoreNum}>{game.awayScore}</Text>
            </>
          )}
        </View>

        <View style={[styles.teamBlock, { alignItems: "flex-end" }]}>
          <View style={[styles.teamNameRow, { flexDirection: "row-reverse" }]}>
            <View style={[styles.teamCircle, { borderColor: game.awayColor, backgroundColor: game.awayColor + "1a" }]}>
              <Ionicons name="shield" size={16} color={game.awayColor} />
            </View>
            <Text style={[styles.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.awayTeam}</Text>
          </View>
        </View>
      </View>

      {isCompleted && (
        <>
          <View style={styles.divider} />
          <View style={styles.mvpRow}>
            <Ionicons name="star" size={12} color={T.accent} />
            <Text style={styles.mvpLabel}>MVP</Text>
            <Text style={styles.mvpName}>{game.mvp.name}</Text>
          </View>
        </>
      )}

      {isPending && game.date && (
        <>
          <View style={styles.divider} />
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={11} color={T.textMuted} />
            <Text style={styles.dateTxt}>{game.date}</Text>
          </View>
        </>
      )}

      {isCompleted && !selectable && (
        <>
          <View style={styles.divider} />
          <View style={styles.recordCta}>
            <Ionicons name="create-outline" size={12} color={T.accent} />
            <Text style={styles.recordCtaText}>Edit result</Text>
            <Ionicons name="chevron-forward" size={12} color={T.accent} />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GamesScreen() {
  const router = useRouter();
  const { games, updateGame, deleteGame } = useStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [exportGame, setExportGame] = useState<Game | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("All");
  const listRef = useRef<ScrollView>(null);

  const filterCounts: Record<FilterKey, number> = {
    All: games.length,
    Upcoming: games.filter((g) => g.status !== "FT").length,
    FT: games.filter((g) => g.status === "FT").length,
  };

  const visibleGames = games.filter((g) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Upcoming") return g.status !== "FT";
    if (activeFilter === "FT") return g.status === "FT";
    return true;
  });

  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownY = useRef(new Animated.Value(-8)).current;

  const openMenu = () => {
    dropdownOpacity.setValue(0); dropdownY.setValue(-8);
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(dropdownY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(dropdownY, { toValue: -8, duration: 140, useNativeDriver: true }),
    ]).start(() => setMenuVisible(false));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmDelete = () => {
    selectedIds.forEach((id) => deleteGame(id));
    setSelectedIds(new Set()); setSelectMode(false); setConfirmVisible(false);
  };
  const cancelSelect = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleFilterChange = (f: FilterKey) => {
    setActiveFilter(f);
    listRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        {selectMode ? (
          <TouchableOpacity onPress={cancelSelect} style={styles.topBarBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openMenu} style={styles.topBarBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={T.textMuted} />
          </TouchableOpacity>
        )}
        <Text style={styles.pageTitle}>Games</Text>
        {selectMode ? (
          <TouchableOpacity onPress={() => selectedIds.size > 0 && setConfirmVisible(true)} style={styles.topBarBtn} disabled={selectedIds.size === 0}>
            <View style={[styles.trashBtn, selectedIds.size === 0 && { opacity: 0.3 }]}>
              <Ionicons name="trash-outline" size={20} color="#cc0000" />
              {selectedIds.size > 0 && (
                <View style={styles.trashBadge}><Text style={styles.trashBadgeText}>{selectedIds.size}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.push("/create-game")}>
            <Ionicons name="add" size={26} color={T.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {menuVisible && (
        <View style={styles.dropdownContainer}>
          <TouchableWithoutFeedback onPress={closeMenu}><View style={styles.dropdownOverlay} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.dropdown, { opacity: dropdownOpacity, transform: [{ translateY: dropdownY }] }]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectMode(true); closeMenu(); }}>
              <Ionicons name="checkbox-outline" size={16} color={T.textPrimary} />
              <Text style={styles.dropdownText}>Select Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {!selectMode && <FilterTabs active={activeFilter} onChange={handleFilterChange} counts={filterCounts} />}

      <ScrollView ref={listRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {visibleGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={36} color={T.textMuted} />
            <Text style={styles.emptyText}>No games here</Text>
          </View>
        ) : (
          visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              selectable={selectMode}
              selected={selectedIds.has(game.id)}
              onSelect={() => toggleSelect(game.id)}
              onTap={() => router.push(`/record-result?gameId=${game.id}`)}
              onExport={() => setExportGame(game)}
            />
          ))
        )}
      </ScrollView>

      <ConfirmDialog visible={confirmVisible} count={selectedIds.size} onConfirm={confirmDelete} onCancel={() => setConfirmVisible(false)} />
      <GameExportSheet game={exportGame} visible={!!exportGame} onClose={() => setExportGame(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, zIndex: 100 },
  topBarBtn: { minWidth: 40, alignItems: "center" },
  pageTitle: { color: T.textPrimary, fontSize: 18, fontWeight: "800" },
  cancelText: { color: T.textMuted, fontSize: 14, fontWeight: "600" },
  trashBtn: { alignItems: "center", justifyContent: "center" },
  trashBadge: { position: "absolute", top: -6, right: -8, backgroundColor: "#cc0000", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  trashBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  dropdownContainer: { ...StyleSheet.absoluteFillObject, zIndex: 200 },
  dropdownOverlay: { ...StyleSheet.absoluteFillObject },
  dropdown: { position: "absolute", top: 56, left: 16, backgroundColor: "#161616", borderRadius: 14, width: 210, overflow: "hidden", borderWidth: 1, borderColor: "#242424" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { color: T.textSecondary, fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 40 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: T.textMuted, fontSize: 14, fontWeight: "600" },

  card: { backgroundColor: T.surface, borderRadius: T.radius.card, overflow: "hidden", borderWidth: 1, borderColor: T.border },
  cardSelected: { borderColor: T.accent, borderWidth: 1.5 },
  checkbox: { marginRight: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 6 },
  cardHeaderMeta: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  leagueText: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  dotSep: { color: T.textMuted, fontSize: 11 },
  locationText: { color: T.textMuted, fontSize: 11, fontWeight: "500", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.border },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  shareIconBtn: { paddingLeft: 8, paddingRight: 2 },
  divider: { height: 1, backgroundColor: T.border },
  scoreRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 16, gap: 8 },
  teamBlock: { flex: 1, gap: 6 },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  teamCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  teamName: { color: T.textSecondary, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  scoreCenter: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8 },
  scoreNum: { color: T.textPrimary, fontSize: T.scoreSize, fontWeight: "900" },
  scoreSep: { color: T.textMuted, fontSize: 22, fontWeight: "300" },
  vsText: { color: T.textMuted, fontSize: 16, fontWeight: "800", letterSpacing: 1.5, paddingHorizontal: 12 },
  mvpRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 7 },
  mvpLabel: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  mvpName: { color: T.textPrimary, fontSize: 12, fontWeight: "700", flex: 1 },
  dateRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  dateTxt: { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  recordCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 11, gap: 6 },
  recordCtaText: { color: T.accent, fontSize: 12, fontWeight: "600" },

  dialogOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  dialog: { backgroundColor: "#161616", borderRadius: 22, width: "100%", overflow: "hidden", alignItems: "center", borderWidth: 1, borderColor: "#242424" },
  dialogIconWrap: { marginTop: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#2a0a0a", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  dialogTitle: { color: T.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 6 },
  dialogSubtitle: { color: T.textSecondary, fontSize: 13, marginBottom: 20 },
  dialogDivider: { height: 1, backgroundColor: "#2a2a2a", width: "100%" },
  dialogActions: { flexDirection: "row", width: "100%" },
  dialogActionsDivider: { width: 1, backgroundColor: "#2a2a2a" },
  dialogCancel: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogCancelText: { color: T.textSecondary, fontSize: 15, fontWeight: "600" },
  dialogConfirm: { flex: 1, paddingVertical: 16, alignItems: "center" },
  dialogConfirmText: { color: "#cc0000", fontSize: 15, fontWeight: "700" },
});
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors (GoalEvent references in the old file are now gone)

- [ ] **Step 3: Manual test**

Open Games tab. Verify: amber filter pills, glass cards, completed games show "Edit result" row at bottom, tapping a completed game opens the Record Result screen.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/games.tsx
git commit -m "feat: redesign games tab, remove live tracker"
```

---

### Task 7: Add edit mode to `app/create-player.tsx`

**Files:**
- Modify: `app/create-player.tsx`

The screen should accept an optional `playerId` URL param. If provided, pre-fill all fields from the store and call `updatePlayer` on save instead of `addPlayer`.

- [ ] **Step 1: Read the current file to understand its structure**

Run: `cat Ballerz/app/create-player.tsx | head -60`

This is needed to understand the existing state variables before editing.

- [ ] **Step 2: Add `useLocalSearchParams` import and edit-mode logic at the top of the component**

After reading the file, add to the imports:
```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
```

At the top of the component function (before any existing state declarations), add:
```tsx
const { playerId } = useLocalSearchParams<{ playerId?: string }>();
const existingPlayer = playerId ? players.find((p) => p.id === playerId) ?? null : null;
const isEditing = !!existingPlayer;
```

- [ ] **Step 3: Pre-fill all useState calls**

Change each initial state value to use `existingPlayer` when available. For example, if the file has:
```tsx
const [name, setName] = useState("");
```
Change to:
```tsx
const [name, setName] = useState(existingPlayer?.name ?? "");
```

Apply the same pattern to: photo, position, foot, form, pac, sho, pas, dri, def, phy.

For numeric stats stored as strings in inputs:
```tsx
const [pac, setPac] = useState(existingPlayer ? String(existingPlayer.pac) : "");
```

- [ ] **Step 4: Update the save handler**

Find the save/submit handler. Change it so that when `isEditing`, it calls `updatePlayer` instead of `addPlayer`. Example — if the existing handler is:
```tsx
const handleSave = () => {
  addPlayer({ name, ovr: calculated, ... });
  router.back();
};
```
Change to:
```tsx
const handleSave = () => {
  const data = { name, ovr: calculated, position, foot, form, pac: +pac, sho: +sho, pas: +pas, dri: +dri, def: +def, phy: +phy, goals: existingPlayer?.goals ?? 0, assists: existingPlayer?.assists ?? 0, mvps: existingPlayer?.mvps ?? 0 };
  if (isEditing && existingPlayer) {
    updatePlayer(existingPlayer.id, data);
  } else {
    addPlayer(data);
  }
  router.back();
};
```

- [ ] **Step 5: Update the screen title/header**

Find where "Add Player" or similar header text is rendered. Make it conditional:
```tsx
<Text style={...}>{isEditing ? "Edit Player" : "Add Player"}</Text>
```

- [ ] **Step 6: Make sure `updatePlayer` is destructured from `useStore`**

Check that the store destructuring includes `updatePlayer`:
```tsx
const { addPlayer, updatePlayer, players } = useStore();
```

- [ ] **Step 7: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add app/create-player.tsx
git commit -m "feat: add edit mode to create-player screen"
```

---

### Task 8: Redesign `app/(tabs)/players.tsx` — add Edit button to player card modal

**Files:**
- Modify: `app/(tabs)/players.tsx`

Apply new background color, glass card styles, and add an Edit button inside the `PlayerCardModal` that navigates to `create-player?playerId=<id>`. No emojis — remove the form badge emojis and replace with Ionicons (`flame-outline` for hot, `snow-outline` for cold).

- [ ] **Step 1: Update background and key style values**

Find `backgroundColor: "#0a0a0a"` in the stylesheet and change to `T.bg`:
```tsx
// Add import at top:
import { T } from "../../constants/theme";

// In styles:
container: { flex: 1, backgroundColor: T.bg },
```

- [ ] **Step 2: Replace `FormBadge` to use Ionicons instead of emojis**

Find the `FormBadge` component and replace:
```tsx
function FormBadge({ form }: { form: Player["form"] }) {
  if (form === "neutral") return null;
  return (
    <Ionicons
      name={form === "hot" ? "flame-outline" : "snow-outline"}
      size={13}
      color={form === "hot" ? "#f97316" : "#60a5fa"}
    />
  );
}
```

- [ ] **Step 3: Add Edit button to `PlayerCardModal`**

Find the `PlayerCardModal` component. Add `useRouter` inside it and add an Edit button below the existing Share Card button:

Add to imports at the top of the file:
```tsx
import { useRouter } from "expo-router";
```

Inside `PlayerCardModal`, after `if (!player) return null;`, add:
```tsx
const router = useRouter();
```

Find the `ms.exportBtn` TouchableOpacity block and add below it:
```tsx
<TouchableOpacity
  style={[ms.exportBtn, { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border }]}
  onPress={() => {
    onClose();
    setTimeout(() => router.push(`/create-player?playerId=${player.id}`), 300);
  }}
>
  <Ionicons name="create-outline" size={18} color={T.textSecondary} />
  <Text style={[ms.exportText, { color: T.textSecondary }]}>Edit Player</Text>
</TouchableOpacity>
```

The `setTimeout` gives the modal time to close before pushing the new screen, avoiding animation conflicts.

- [ ] **Step 4: Update card background colors to use T tokens**

Find `.mvpCard`, `.row`, `.statChip` etc. and update `backgroundColor: "#111"` → `T.surface`, `borderColor: "#1e1e1e"` → `T.border` where appropriate.

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Manual test**

Open Players tab, tap a player. Verify the card shows an "Edit Player" button. Tap it — verify create-player opens pre-filled with the player's data.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: add edit player button, replace emoji with icons in players tab"
```

---

### Task 9: Install react-native-svg and redesign `app/(tabs)/stats.tsx`

**Files:**
- Modify: `app/(tabs)/stats.tsx`

Replace all hardcoded data with real store data. Add a hexagonal radar chart using `react-native-svg`. Implement the rivalry card. No emojis.

- [ ] **Step 1: Install react-native-svg**

Run: `npx expo install react-native-svg`
Expected: package installed, `package.json` updated

- [ ] **Step 2: Verify TypeScript sees the new types**

Run: `npx tsc --noEmit`
Expected: no errors (react-native-svg ships its own types)

- [ ] **Step 3: Write the new stats screen**

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { useAppStats, useRivalry, useLastGameRadar } from "../../store/selectors";
import { T } from "../../constants/theme";

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const AXES = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"] as const;
const RADAR_SIZE = 180;
const CENTER = RADAR_SIZE / 2;
const RADIUS = 70;

function point(angle: number, r: number): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function hexPoints(values: number[], maxVal = 100): string {
  return AXES.map((_, i) => {
    const { x, y } = point(i * 60, (values[i] / maxVal) * RADIUS);
    return `${x},${y}`;
  }).join(" ");
}

function RadarChart({ home, away }: {
  home: { color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };
  away: { color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };
}) {
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const homeVals = [home.pac, home.sho, home.pas, home.dri, home.def, home.phy];
  const awayVals = [away.pac, away.sho, away.pas, away.dri, away.def, away.phy];

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <Polygon
          key={level}
          points={hexPoints([100, 100, 100, 100, 100, 100].map((v) => v * level))}
          fill="none"
          stroke={T.border}
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((_, i) => {
        const outer = point(i * 60, RADIUS);
        return (
          <Line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={outer.x} y2={outer.y}
            stroke={T.border}
            strokeWidth={1}
          />
        );
      })}

      {/* Away team polygon */}
      <Polygon
        points={hexPoints(awayVals)}
        fill={away.color + "22"}
        stroke={away.color}
        strokeWidth={1.5}
      />

      {/* Home team polygon */}
      <Polygon
        points={hexPoints(homeVals)}
        fill={home.color + "22"}
        stroke={home.color}
        strokeWidth={1.5}
      />

      {/* Center dot */}
      <Circle cx={CENTER} cy={CENTER} r={3} fill={T.textMuted} />

      {/* Axis labels */}
      {AXES.map((label, i) => {
        const { x, y } = point(i * 60, RADIUS + 14);
        return (
          <SvgText
            key={label}
            x={x} y={y}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={9}
            fontWeight="700"
            fill={T.textMuted}
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { gamesCount, totalGoals } = useAppStats();
  const rivalry = useRivalry();
  const radar = useLastGameRadar();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Stats</Text>

        {/* League totals */}
        <View style={s.totalStrip}>
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: "#60a5fa" }]}>{gamesCount}</Text>
            <Text style={s.totalLbl}>GAMES</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: T.accent }]}>{totalGoals}</Text>
            <Text style={s.totalLbl}>GOALS</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalItem}>
            <Text style={[s.totalVal, { color: "#a78bfa" }]}>
              {gamesCount > 0 ? (totalGoals / gamesCount).toFixed(1) : "—"}
            </Text>
            <Text style={s.totalLbl}>AVG/GAME</Text>
          </View>
        </View>

        {/* Rivalry card */}
        {rivalry && (
          <>
            <Text style={s.sectionEyebrow}>RIVALRY</Text>
            <View style={s.card}>
              <View style={s.rivalryHeader}>
                <View style={s.rivalryBadge}>
                  <Ionicons name="flame" size={11} color={T.accent} />
                  <Text style={s.rivalryBadgeTxt}>TOP MATCHUP</Text>
                </View>
                <Text style={s.rivalryCount}>{rivalry.count} games</Text>
              </View>
              <View style={s.rivalryTeams}>
                <Text style={s.rivalryTeamName}>{rivalry.home}</Text>
                <Text style={s.rivalryVs}>vs</Text>
                <Text style={[s.rivalryTeamName, { textAlign: "right" }]}>{rivalry.away}</Text>
              </View>
              <View style={s.rivalryRecord}>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: "#4ade80" }]}>{rivalry.homeWins}</Text>
                  <Text style={s.recordLbl}>W</Text>
                </View>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: T.textMuted }]}>{rivalry.draws}</Text>
                  <Text style={s.recordLbl}>D</Text>
                </View>
                <View style={s.recordItem}>
                  <Text style={[s.recordVal, { color: "#f87171" }]}>{rivalry.awayWins}</Text>
                  <Text style={s.recordLbl}>L</Text>
                </View>
              </View>
              {rivalry.lastGame && (
                <View style={s.rivalryLast}>
                  <Text style={s.rivalryLastLbl}>Last result</Text>
                  <Text style={s.rivalryLastScore}>
                    {rivalry.lastGame.homeScore} – {rivalry.lastGame.awayScore}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Last match radar */}
        {radar && (
          <>
            <Text style={s.sectionEyebrow}>LAST MATCH COMPARISON</Text>
            <View style={s.card}>
              <View style={s.radarLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: radar.home.color }]} />
                  <Text style={s.legendName}>{radar.home.label}</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: radar.away.color }]} />
                  <Text style={s.legendName}>{radar.away.label}</Text>
                </View>
              </View>
              <View style={s.radarWrap}>
                <RadarChart home={radar.home} away={radar.away} />
              </View>
            </View>
          </>
        )}

        {gamesCount === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="stats-chart-outline" size={36} color={T.textMuted} />
            <Text style={s.emptyText}>Play some games to see stats</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: T.bg },
  content: { paddingHorizontal: 16, paddingBottom: 16 },

  pageTitle: { color: T.textPrimary, fontSize: 22, fontWeight: "900", paddingTop: 14, marginBottom: 16 },

  sectionEyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 2, color: T.textMuted, textTransform: "uppercase", marginBottom: 8, marginTop: 20 },

  totalStrip:   { flexDirection: "row", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: T.radius.card, overflow: "hidden", marginBottom: 4 },
  totalItem:    { flex: 1, paddingVertical: 14, alignItems: "center" },
  totalDivider: { width: 1, backgroundColor: T.border },
  totalVal:     { fontSize: 22, fontWeight: "800" },
  totalLbl:     { fontSize: 8, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },

  card:   { backgroundColor: T.surface, borderRadius: T.radius.card, borderWidth: 1, borderColor: T.border, padding: 14 },

  rivalryHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rivalryBadge:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: T.accentMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: T.accentBorder },
  rivalryBadgeTxt: { color: T.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  rivalryCount:    { color: T.textMuted, fontSize: 11, fontWeight: "600" },
  rivalryTeams:    { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rivalryTeamName: { flex: 1, color: T.textPrimary, fontSize: 15, fontWeight: "800" },
  rivalryVs:       { color: T.textMuted, fontSize: 11, fontWeight: "700", paddingHorizontal: 12 },
  rivalryRecord:   { flexDirection: "row", gap: 20, marginBottom: 10 },
  recordItem:      { alignItems: "center" },
  recordVal:       { fontSize: 20, fontWeight: "900" },
  recordLbl:       { fontSize: 9, color: T.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  rivalryLast:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  rivalryLastLbl:  { color: T.textMuted, fontSize: 11 },
  rivalryLastScore:{ color: T.textPrimary, fontSize: 15, fontWeight: "800" },

  radarLegend:  { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendName:   { color: T.textSecondary, fontSize: 12, fontWeight: "600" },
  radarWrap:    { alignItems: "center" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText:  { color: T.textMuted, fontSize: 14, fontWeight: "600" },
});
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Manual test**

Navigate to Stats tab. If there are no games, verify the empty state shows. Add a completed game (or use existing test data) and verify the totals strip, rivalry card (needs 2+ games with same teams), and radar chart all render correctly. Verify no emojis.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/stats.tsx package.json
git commit -m "feat: redesign stats tab with rivalry card and radar chart"
```

---

### Task 10: Visual pass on `app/(tabs)/league.tsx`

**Files:**
- Modify: `app/(tabs)/league.tsx`

Apply new background (`T.bg`), glass card surfaces, amber accent on save button, remove any emoji characters.

- [ ] **Step 1: Add T import**

```tsx
import { T } from "../../constants/theme";
```

- [ ] **Step 2: Update background and surface colors**

Find the root container style and change `backgroundColor: "#0a0a0a"` (or similar) to `backgroundColor: T.bg`.

Find any card/section backgrounds (`backgroundColor: "#111"`, `backgroundColor: "#161616"`, etc.) and change to `backgroundColor: T.surface` with `borderColor: T.border`.

- [ ] **Step 3: Update save/CTA button**

Find the save button (likely `backgroundColor: "#0039a3"` or similar) and change to `backgroundColor: T.accent`. Change button text color to `"#000"`.

- [ ] **Step 4: Remove any emoji characters**

Search the file for emoji strings (🏆, 📍, ⚽, etc.) and replace with corresponding Ionicons. Common substitutions:
- `🏆` → `<Ionicons name="trophy-outline" size={16} color={...} />`
- `📍` → `<Ionicons name="location-outline" size={16} color={...} />`

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Manual test**

Open League tab. Verify dark space background, glass form fields, amber save button, no emojis.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/league.tsx
git commit -m "feat: apply new design tokens to league tab"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| New design tokens | Task 1 |
| Remove GoalEvent / live tracking | Task 2 |
| Rivalry selector | Task 3 |
| Radar selector | Task 3 |
| record-result screen | Task 4 |
| Home tab redesign | Task 5 |
| Games tab redesign + live tracker removal | Task 6 |
| Edit player support | Task 7 + 8 |
| Stats tab with real data | Task 9 |
| League tab visual pass | Task 10 |
| No emojis, Ionicons only | Tasks 5–10 (enforced per-task) |
| Score 28px | T.scoreSize token, used in Tasks 5 + 6 |
| No team-color glows | Confirmed absent in all card implementations |

**Type consistency check:** `T.scoreSize`, `T.bg`, `T.surface`, `T.border`, `T.accent`, `T.accentMuted`, `T.accentBorder`, `T.textPrimary`, `T.textSecondary`, `T.textMuted`, `T.radius.card`, `T.radius.pill`, `T.radius.badge` — all defined in Task 1 and used consistently in Tasks 3–10.

**Placeholder scan:** No TBDs, no incomplete sections. Task 7 Step 1 instructs the engineer to read the current `create-player.tsx` first, which is intentional since that file wasn't read during planning — the instructions are self-contained for someone doing it fresh.
