# Create Flows & League Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add league identity (onboarding wizard + League tab) and build dedicated create screens for players and games, while wiring navigation buttons into the existing tabs.

**Architecture:** New screens live as top-level Expo Router routes (`onboarding.tsx`, `create-player.tsx`, `create-game.tsx`) and a new fifth tab (`league.tsx`). The Zustand store gains a `league` slice and a `hasOnboarded` flag. Existing tabs (`games.tsx`, `players.tsx`) are unchanged except for adding navigation buttons — they have no create logic to remove.

**Tech Stack:** Expo Router v6, Zustand v5, expo-image-picker (already installed), React Native core components, Ionicons, expo-linear-gradient.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `types/games.ts` | Remove `homeCaptain`, `awayCaptain` fields |
| Create | `types/league.ts` | `League` type |
| Modify | `store/index.ts` | Add `league` slice, `hasOnboarded`, `setLeague`, `completeOnboarding` |
| Create | `utils/ovr.ts` | Pure `calculateOvr()` function |
| Modify | `app/_layout.tsx` | Register new routes, onboarding redirect |
| Create | `app/onboarding.tsx` | First-launch 3-step wizard |
| Modify | `app/(tabs)/_layout.tsx` | Add League tab |
| Create | `app/(tabs)/league.tsx` | Profile card + edit form |
| Create | `app/create-player.tsx` | Modal bottom sheet for adding players |
| Create | `app/create-game.tsx` | Full-screen 3-step game creation wizard |
| Modify | `app/(tabs)/players.tsx` | Add "Add Player" button |
| Modify | `app/(tabs)/games.tsx` | Add "Create Game" button |

---

### Task 1: Remove captain fields from Game type

**Files:**
- Modify: `types/games.ts`

- [ ] **Step 1: Replace the file with captain fields removed**

`types/games.ts`:
```typescript
export type GamePlayer = {
  id: string;
  name: string;
  position: string;
};

export type GoalEvent = {
  id: string;
  playerId: string;
  playerName: string;
  team: "home" | "away";
  minute: number;
  type: "goal" | "assist";
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
  goalEvents?: GoalEvent[];
};

export type ExportMode = "options" | "result" | "preview" | "teamsheet";
```

- [ ] **Step 2: Check for TypeScript errors**

Run: `npx tsc --noEmit`

Fix any errors referencing `homeCaptain` or `awayCaptain` in `games.tsx` (search for those strings and delete the lines).

- [ ] **Step 3: Commit**

```bash
git add types/games.ts
git commit -m "chore: remove homeCaptain and awayCaptain from Game type"
```

---

### Task 2: Create League type

**Files:**
- Create: `types/league.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Create `types/league.ts`**

```typescript
export type League = {
  name: string;
  logoUri: string | null;
  color: string;
  defaultLocation: string;
  defaultTeamSize: number;
  adminName: string;
};
```

- [ ] **Step 2: Re-export from `types/index.ts`**

Open `types/index.ts` and add:
```typescript
export type { League } from "./league";
```

- [ ] **Step 3: Commit**

```bash
git add types/league.ts types/index.ts
git commit -m "feat: add League type"
```

---

### Task 3: Add league slice and hasOnboarded to store

**Files:**
- Modify: `store/index.ts`

- [ ] **Step 1: Replace `store/index.ts` with the expanded store**

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Player } from "../types/players";
import type { Game } from "../types/games";
import type { League } from "../types/league";

const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

interface BallerzStore {
  players: Player[];
  games: Game[];
  league: League;
  hasOnboarded: boolean;

  addPlayer: (player: Omit<Player, "id">) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  setMvp: (playerId: string) => void;

  addGame: (game: Omit<Game, "id">) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  finishGame: (
    id: string,
    homeScore: number,
    awayScore: number,
    mvpName: string,
    mvpStat: string
  ) => void;

  setLeague: (updates: Partial<League>) => void;
  completeOnboarding: () => void;
}

export const useStore = create<BallerzStore>()(
  persist(
    (set) => ({
      players: [],
      games: [],
      league: {
        name: "",
        logoUri: null,
        color: "#0039a3",
        defaultLocation: "",
        defaultTeamSize: 5,
        adminName: "",
      },
      hasOnboarded: false,

      addPlayer: (player) =>
        set((s) => ({
          players: [...s.players, { ...player, id: genId() }],
        })),

      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      setMvp: (playerId) =>
        set((s) => ({
          players: s.players.map((p) => ({
            ...p,
            isMvp: p.id === playerId,
          })),
        })),

      addGame: (game) =>
        set((s) => ({
          games: [...s.games, { ...game, id: genId() }],
        })),

      updateGame: (id, updates) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGame: (id) =>
        set((s) => ({ games: s.games.filter((g) => g.id !== id) })),

      finishGame: (id, homeScore, awayScore, mvpName, mvpStat) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id === id
              ? {
                  ...g,
                  status: "FT" as const,
                  homeScore,
                  awayScore,
                  mvp: { name: mvpName, stat: mvpStat },
                }
              : g
          ),
        })),

      setLeague: (updates) =>
        set((s) => ({ league: { ...s.league, ...updates } })),

      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: "ballerz-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add store/index.ts
git commit -m "feat: add league slice and hasOnboarded to store"
```

---

### Task 4: Create OVR utility

**Files:**
- Create: `utils/ovr.ts`

- [ ] **Step 1: Create `utils/ovr.ts`**

```typescript
export function calculateOvr(
  pac: number,
  sho: number,
  pas: number,
  dri: number,
  def: number,
  phy: number
): number {
  return Math.round((pac + sho + pas + dri + def + phy) / 6);
}
```

- [ ] **Step 2: Verify manually**

`calculateOvr(80, 80, 80, 80, 80, 80)` should equal `80`.
`calculateOvr(70, 80, 75, 85, 60, 72)` should equal `74`.

- [ ] **Step 3: Commit**

```bash
git add utils/ovr.ts
git commit -m "feat: add calculateOvr utility"
```

---

### Task 5: Update root layout — register new routes and onboarding redirect

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Replace `app/_layout.tsx`**

```typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStore } from '../store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const router = useRouter();

  useEffect(() => {
    if (!hasOnboarded) {
      router.replace('/onboarding');
    }
  }, [hasOnboarded]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="create-player"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="create-game"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: register onboarding, create-player, create-game routes"
```

---

### Task 6: Build onboarding wizard

**Files:**
- Create: `app/onboarding.tsx`

- [ ] **Step 1: Create `app/onboarding.tsx`**

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";

const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0"];
const TEAM_SIZES = [5, 7, 11];

export default function Onboarding() {
  const router = useRouter();
  const { setLeague, completeOnboarding } = useStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [color, setColor] = useState("#0039a3");
  const [adminName, setAdminName] = useState("");
  const [defaultLocation, setDefaultLocation] = useState("");
  const [defaultTeamSize, setDefaultTeamSize] = useState(5);

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  }

  function finish() {
    if (!name.trim()) {
      Alert.alert("Missing info", "Please enter a league name.");
      return;
    }
    setLeague({ name: name.trim(), logoUri, color, adminName: adminName.trim(), defaultLocation: defaultLocation.trim(), defaultTeamSize });
    completeOnboarding();
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Progress dots */}
        <View style={s.dots}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[s.dot, step >= n && s.dotActive]} />
          ))}
        </View>

        {step === 1 && (
          <View style={s.section}>
            <Text style={s.title}>Create your league</Text>
            <Text style={s.subtitle}>Let's get you set up</Text>

            {/* Logo picker */}
            <TouchableOpacity style={s.logoPicker} onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={s.logoImg} />
              ) : (
                <View style={s.logoPlaceholder}>
                  <Ionicons name="trophy" size={40} color="#555" />
                </View>
              )}
              <Text style={s.logoHint}>Tap to add logo (optional)</Text>
            </TouchableOpacity>

            {/* League name */}
            <Text style={s.label}>League name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sunday League"
              placeholderTextColor="#555"
            />

            {/* Color swatches */}
            <Text style={s.label}>League color</Text>
            <View style={s.swatches}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.swatch, { backgroundColor: c }, color === c && s.swatchSelected]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
              <Text style={s.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={s.section}>
            <Text style={s.title}>Details</Text>

            <Text style={s.label}>Your name (admin)</Text>
            <TextInput
              style={s.input}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="e.g. Koren"
              placeholderTextColor="#555"
            />

            <Text style={s.label}>Default location</Text>
            <TextInput
              style={s.input}
              value={defaultLocation}
              onChangeText={setDefaultLocation}
              placeholder="e.g. The Cage"
              placeholderTextColor="#555"
            />

            <Text style={s.label}>Default team size</Text>
            <View style={s.pills}>
              {TEAM_SIZES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[s.pill, defaultTeamSize === n && s.pillActive]}
                  onPress={() => setDefaultTeamSize(n)}
                >
                  <Text style={[s.pillText, defaultTeamSize === n && s.pillTextActive]}>
                    {n}v{n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setStep(1)}>
                <Text style={s.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setStep(3)}>
                <Text style={s.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={s.section}>
            <Text style={s.title}>You're all set</Text>

            {/* Preview card */}
            <View style={[s.previewCard, { borderColor: color }]}>
              <View style={[s.previewBanner, { backgroundColor: color }]} />
              <View style={s.previewBody}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={s.previewLogo} />
                ) : (
                  <View style={[s.previewLogo, s.previewLogoPlaceholder]}>
                    <Ionicons name="trophy" size={28} color="#555" />
                  </View>
                )}
                <Text style={s.previewName}>{name || "Your League"}</Text>
                {adminName ? <Text style={s.previewAdmin}>{adminName}</Text> : null}
              </View>
            </View>

            <View style={s.row}>
              <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setStep(2)}>
                <Text style={s.btnSecondaryText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={finish}>
                <Text style={s.btnText}>Let's go 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { flexGrow: 1, padding: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#333" },
  dotActive: { backgroundColor: "#f5c518" },
  section: { flex: 1, gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 15, color: "#888" },
  label: { fontSize: 13, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  logoPicker: { alignItems: "center", gap: 8, marginVertical: 8 },
  logoImg: { width: 88, height: 88, borderRadius: 44 },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
  },
  logoHint: { fontSize: 13, color: "#555" },
  swatches: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#f5c518", borderColor: "#f5c518" },
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 15 },
  pillTextActive: { color: "#000" },
  btn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    width: 80,
    marginTop: 8,
    marginRight: 10,
  },
  btnSecondaryText: { color: "#aaa", fontWeight: "600", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center" },
  previewCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#111",
    marginVertical: 8,
  },
  previewBanner: { height: 60 },
  previewBody: { alignItems: "center", paddingVertical: 16, gap: 8 },
  previewLogo: { width: 64, height: 64, borderRadius: 32, marginTop: -42 },
  previewLogoPlaceholder: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
    marginTop: -42,
  },
  previewName: { fontSize: 20, fontWeight: "700", color: "#fff" },
  previewAdmin: { fontSize: 13, color: "#888" },
});
```

- [ ] **Step 2: Run app and verify**

Start with `npx expo start`. On first launch the app should navigate to the onboarding screen. Complete all 3 steps and confirm it lands on the Home tab. Relaunch — onboarding should NOT show again.

- [ ] **Step 3: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: add onboarding wizard"
```

---

### Task 7: Add League tab to navigation

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/league.tsx`

- [ ] **Step 1: Add League tab to `app/(tabs)/_layout.tsx`**

Replace the file:
```typescript
import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
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

- [ ] **Step 2: Create `app/(tabs)/league.tsx`**

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../store";

const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0"];
const TEAM_SIZES = [5, 7, 11];

export default function LeagueScreen() {
  const { league, games, setLeague } = useStore();

  const [name, setName] = useState(league.name);
  const [logoUri, setLogoUri] = useState<string | null>(league.logoUri);
  const [color, setColor] = useState(league.color);
  const [adminName, setAdminName] = useState(league.adminName);
  const [defaultLocation, setDefaultLocation] = useState(league.defaultLocation);
  const [defaultTeamSize, setDefaultTeamSize] = useState(league.defaultTeamSize);

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  }

  function save() {
    if (!name.trim()) {
      Alert.alert("Missing info", "League name cannot be empty.");
      return;
    }
    setLeague({
      name: name.trim(),
      logoUri,
      color,
      adminName: adminName.trim(),
      defaultLocation: defaultLocation.trim(),
      defaultTeamSize,
    });
    Alert.alert("Saved", "League settings updated.");
  }

  // Darken league color for gradient end
  const gradientEnd = "#0a0a0a";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Profile card */}
        <View style={s.card}>
          <LinearGradient
            colors={[color, gradientEnd]}
            style={s.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={s.cardBody}>
            <TouchableOpacity onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={s.logo} />
              ) : (
                <View style={[s.logo, s.logoPlaceholder]}>
                  <Ionicons name="trophy" size={28} color="#555" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={s.leagueName}>{league.name || "Your League"}</Text>
            {league.adminName ? <Text style={s.adminName}>{league.adminName}</Text> : null}
            <Text style={s.gameCount}>{games.length} game{games.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Edit form */}
        <Text style={s.sectionTitle}>Edit League</Text>

        <Text style={s.label}>League name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor="#555" placeholder="Sunday League" />

        <Text style={s.label}>League logo</Text>
        <TouchableOpacity style={s.logoPicker} onPress={pickLogo}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={s.logoThumb} />
          ) : (
            <Ionicons name="image-outline" size={22} color="#888" />
          )}
          <Text style={s.logoPickerText}>{logoUri ? "Change logo" : "Pick logo image"}</Text>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <Text style={s.label}>League color</Text>
        <View style={s.swatches}>
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[s.swatch, { backgroundColor: c }, color === c && s.swatchSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={s.label}>Admin name</Text>
        <TextInput style={s.input} value={adminName} onChangeText={setAdminName} placeholderTextColor="#555" placeholder="Your name" />

        <Text style={s.label}>Default location</Text>
        <TextInput style={s.input} value={defaultLocation} onChangeText={setDefaultLocation} placeholderTextColor="#555" placeholder="e.g. The Cage" />

        <Text style={s.label}>Default team size</Text>
        <View style={s.pills}>
          {TEAM_SIZES.map((n) => (
            <TouchableOpacity
              key={n}
              style={[s.pill, defaultTeamSize === n && s.pillActive]}
              onPress={() => setDefaultTeamSize(n)}
            >
              <Text style={[s.pillText, defaultTeamSize === n && s.pillTextActive]}>{n}v{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={save}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 16, overflow: "hidden", backgroundColor: "#111", marginBottom: 8 },
  banner: { height: 70 },
  cardBody: { alignItems: "center", paddingBottom: 20, gap: 4 },
  logo: { width: 72, height: 72, borderRadius: 36, marginTop: -36 },
  logoPlaceholder: {
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#333",
    marginTop: -36,
  },
  leagueName: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 8 },
  adminName: { fontSize: 13, color: "#aaa" },
  gameCount: { fontSize: 12, color: "#555", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginTop: 8 },
  label: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  logoPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  logoThumb: { width: 28, height: 28, borderRadius: 14 },
  logoPickerText: { flex: 1, color: "#aaa", fontSize: 15 },
  swatches: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#f5c518", borderColor: "#f5c518" },
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 15 },
  pillTextActive: { color: "#000" },
  saveBtn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
```

- [ ] **Step 3: Run app and verify**

A fifth "League" tab should appear. Tap it — see the profile card and edit form. Change the league name and tap Save — the card updates immediately.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/_layout.tsx app/(tabs)/league.tsx
git commit -m "feat: add League tab with profile card and edit form"
```

---

### Task 8: Build create-player modal

**Files:**
- Create: `app/create-player.tsx`

- [ ] **Step 1: Create `app/create-player.tsx`**

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { calculateOvr } from "../utils/ovr";

const POSITIONS = ["GK", "DF", "MF", "FW"] as const;
const FORMS = [
  { value: "hot", label: "🔥 Hot" },
  { value: "neutral", label: "➡️ Neutral" },
  { value: "cold", label: "❄️ Cold" },
] as const;

type StatKey = "pac" | "sho" | "pas" | "dri" | "def" | "phy";
const STAT_KEYS: StatKey[] = ["pac", "sho", "pas", "dri", "def", "phy"];
const STAT_LABELS: Record<StatKey, string> = {
  pac: "PAC", sho: "SHO", pas: "PAS", dri: "DRI", def: "DEF", phy: "PHY",
};

export default function CreatePlayer() {
  const router = useRouter();
  const { addPlayer } = useStore();

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<string>("MF");
  const [foot, setFoot] = useState<"L" | "R">("R");
  const [form, setForm] = useState<"hot" | "cold" | "neutral">("neutral");
  const [stats, setStats] = useState<Record<StatKey, string>>({
    pac: "", sho: "", pas: "", dri: "", def: "", phy: "",
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  function setStat(key: StatKey, raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, "").slice(0, 2);
    setStats((prev) => ({ ...prev, [key]: cleaned }));
  }

  const parsedStats = {
    pac: parseInt(stats.pac) || 0,
    sho: parseInt(stats.sho) || 0,
    pas: parseInt(stats.pas) || 0,
    dri: parseInt(stats.dri) || 0,
    def: parseInt(stats.def) || 0,
    phy: parseInt(stats.phy) || 0,
  };
  const ovr = calculateOvr(
    parsedStats.pac, parsedStats.sho, parsedStats.pas,
    parsedStats.dri, parsedStats.def, parsedStats.phy
  );
  const hasAtLeastOneStat = STAT_KEYS.some((k) => stats[k] !== "");
  const canSave = name.trim().length > 0 && hasAtLeastOneStat;

  function save() {
    if (!canSave) {
      Alert.alert("Missing info", "Enter a name and at least one stat.");
      return;
    }
    addPlayer({
      name: name.trim(),
      photo,
      position,
      foot,
      form,
      ovr,
      ...parsedStats,
      goals: 0,
      assists: 0,
      mvps: 0,
      isMvp: false,
    });
    router.back();
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#aaa" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Player</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Photo */}
        <TouchableOpacity style={s.photoRow} onPress={pickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={s.photoImg} />
          ) : (
            <View style={s.photoPlaceholder}>
              <Ionicons name="person" size={36} color="#555" />
            </View>
          )}
          <Text style={s.photoHint}>Tap to add photo</Text>
        </TouchableOpacity>

        {/* Name */}
        <Text style={s.label}>Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Player name"
          placeholderTextColor="#555"
        />

        {/* Position */}
        <Text style={s.label}>Position</Text>
        <View style={s.pills}>
          {POSITIONS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.pill, position === p && s.pillActive]}
              onPress={() => setPosition(p)}
            >
              <Text style={[s.pillText, position === p && s.pillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Foot */}
        <Text style={s.label}>Preferred foot</Text>
        <View style={s.pills}>
          {(["L", "R"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.pill, foot === f && s.pillActive]}
              onPress={() => setFoot(f)}
            >
              <Text style={[s.pillText, foot === f && s.pillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <Text style={s.label}>Form</Text>
        <View style={s.pills}>
          {FORMS.map((fm) => (
            <TouchableOpacity
              key={fm.value}
              style={[s.pill, { flex: 1 }, form === fm.value && s.pillActive]}
              onPress={() => setForm(fm.value)}
            >
              <Text style={[s.pillText, form === fm.value && s.pillTextActive]}>{fm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats grid */}
        <Text style={s.label}>Stats</Text>
        <View style={s.statsGrid}>
          {STAT_KEYS.map((key) => (
            <View key={key} style={s.statCell}>
              <Text style={s.statLabel}>{STAT_LABELS[key]}</Text>
              <TextInput
                style={s.statInput}
                value={stats[key]}
                onChangeText={(v) => setStat(key, v)}
                keyboardType="numeric"
                maxLength={2}
                placeholder="—"
                placeholderTextColor="#444"
                textAlign="center"
              />
            </View>
          ))}
        </View>

        {/* OVR */}
        <View style={s.ovrRow}>
          <Text style={s.ovrLabel}>OVR</Text>
          <Text style={s.ovrValue}>{hasAtLeastOneStat ? ovr : "—"}</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
          onPress={save}
          disabled={!canSave}
        >
          <Text style={s.saveBtnText}>Add Player</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  photoRow: { alignItems: "center", gap: 8, marginVertical: 8 },
  photoImg: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
  },
  photoHint: { fontSize: 13, color: "#555" },
  label: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  pills: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  pillActive: { backgroundColor: "#f5c518", borderColor: "#f5c518" },
  pillText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
  pillTextActive: { color: "#000" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCell: { width: "30%", alignItems: "center", gap: 4 },
  statLabel: { fontSize: 11, fontWeight: "700", color: "#888", textTransform: "uppercase" },
  statInput: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  ovrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  ovrLabel: { fontSize: 14, fontWeight: "700", color: "#aaa" },
  ovrValue: { fontSize: 28, fontWeight: "900", color: "#f5c518" },
  saveBtn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
```

- [ ] **Step 2: Run app and verify**

Navigate to this screen by temporarily adding `router.push('/create-player')` to a button in players.tsx, or test directly via `npx expo start` and navigating by URL `/create-player`. Fill in name + stats — OVR should update live. Tap "Add Player" — player should appear in the store.

- [ ] **Step 3: Commit**

```bash
git add app/create-player.tsx utils/ovr.ts
git commit -m "feat: add create-player modal with live OVR calculation"
```

---

### Task 9: Build create-game wizard

**Files:**
- Create: `app/create-game.tsx`

- [ ] **Step 1: Create `app/create-game.tsx`**

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import type { GamePlayer } from "../types/games";

const TEAM_SIZE_OPTIONS = [5, 7, 11];
const PRESET_COLORS = ["#f5c518", "#0039a3", "#cc0000", "#1a7a1a", "#7b2fbe", "#e0e0e0", "#ff6b00", "#00bcd4"];

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function CreateGame() {
  const router = useRouter();
  const { players, league, addGame } = useStore();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeColor, setHomeColor] = useState(league.color);
  const [awayColor, setAwayColor] = useState("#cc0000");
  const [date, setDate] = useState(today());
  const [location, setLocation] = useState(league.defaultLocation);

  // Step 2 state
  const [homePlayers, setHomePlayers] = useState<GamePlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<GamePlayer[]>([]);
  const limit = league.defaultTeamSize;

  function togglePlayer(side: "home" | "away", player: { id: string; name: string; position: string }) {
    const gamePlayer: GamePlayer = { id: player.id, name: player.name, position: player.position };
    if (side === "home") {
      const exists = homePlayers.some((p) => p.id === player.id);
      if (exists) {
        setHomePlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else if (homePlayers.length < limit) {
        setHomePlayers((prev) => [...prev, gamePlayer]);
      }
    } else {
      const exists = awayPlayers.some((p) => p.id === player.id);
      if (exists) {
        setAwayPlayers((prev) => prev.filter((p) => p.id !== player.id));
      } else if (awayPlayers.length < limit) {
        setAwayPlayers((prev) => [...prev, gamePlayer]);
      }
    }
  }

  function create() {
    addGame({
      league: league.name || "League",
      homeTeam: homeTeam.trim() || "Home",
      awayTeam: awayTeam.trim() || "Away",
      homeColor,
      awayColor,
      date,
      location: location.trim() || undefined,
      status: "Pending",
      homeScore: 0,
      awayScore: 0,
      mvp: { name: "", stat: "" },
      homePlayers,
      awayPlayers,
      goalEvents: [],
    });
    router.replace("/(tabs)/games");
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color="#aaa" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Game</Text>
        <Text style={s.stepLabel}>Step {step}/3</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      {step === 1 && (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionTitle}>Match Setup</Text>

          <Text style={s.label}>Home team name</Text>
          <TextInput style={s.input} value={homeTeam} onChangeText={setHomeTeam} placeholder="Home team" placeholderTextColor="#555" />

          <Text style={s.label}>Home color</Text>
          <View style={s.swatches}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={"home-" + c}
                style={[s.swatch, { backgroundColor: c }, homeColor === c && s.swatchSelected]}
                onPress={() => setHomeColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>Away team name</Text>
          <TextInput style={s.input} value={awayTeam} onChangeText={setAwayTeam} placeholder="Away team" placeholderTextColor="#555" />

          <Text style={s.label}>Away color</Text>
          <View style={s.swatches}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={"away-" + c}
                style={[s.swatch, { backgroundColor: c }, awayColor === c && s.swatchSelected]}
                onPress={() => setAwayColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>Date</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" placeholderTextColor="#555" />

          <Text style={s.label}>Location</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. The Cage" placeholderTextColor="#555" />

          <TouchableOpacity style={s.btn} onPress={() => setStep(2)}>
            <Text style={s.btnText}>Next: Lineup</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 2 && (
        <View style={s.lineupContainer}>
          <Text style={s.sectionTitle}>Pick Lineup</Text>
          <View style={s.lineupHeader}>
            <Text style={[s.teamHeaderText, { color: homeColor }]}>
              {homeTeam || "Home"} ({homePlayers.length}/{limit})
            </Text>
            <Text style={[s.teamHeaderText, { color: awayColor }]}>
              {awayTeam || "Away"} ({awayPlayers.length}/{limit})
            </Text>
          </View>
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            renderItem={({ item }) => {
              const onHome = homePlayers.some((p) => p.id === item.id);
              const onAway = awayPlayers.some((p) => p.id === item.id);
              return (
                <View style={s.playerRow}>
                  <Text style={s.playerName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.playerPos}>{item.position}</Text>
                  <View style={s.sideButtons}>
                    <TouchableOpacity
                      style={[s.sideBtn, { borderColor: homeColor }, onHome && { backgroundColor: homeColor }]}
                      onPress={() => togglePlayer("home", item)}
                      disabled={onAway || (!onHome && homePlayers.length >= limit)}
                    >
                      <Text style={[s.sideBtnText, onHome && { color: "#000" }]}>H</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.sideBtn, { borderColor: awayColor }, onAway && { backgroundColor: awayColor }]}
                      onPress={() => togglePlayer("away", item)}
                      disabled={onHome || (!onAway && awayPlayers.length >= limit)}
                    >
                      <Text style={[s.sideBtnText, onAway && { color: "#000" }]}>A</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          <TouchableOpacity style={[s.btn, { margin: 12 }]} onPress={() => setStep(3)}>
            <Text style={s.btnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.sectionTitle}>Confirm Match</Text>

          <View style={s.confirmCard}>
            <View style={s.confirmTeams}>
              <View style={s.confirmTeam}>
                <View style={[s.colorDot, { backgroundColor: homeColor }]} />
                <Text style={s.confirmTeamName}>{homeTeam || "Home"}</Text>
                <Text style={s.confirmCount}>{homePlayers.length} players</Text>
              </View>
              <Text style={s.vsText}>vs</Text>
              <View style={s.confirmTeam}>
                <View style={[s.colorDot, { backgroundColor: awayColor }]} />
                <Text style={s.confirmTeamName}>{awayTeam || "Away"}</Text>
                <Text style={s.confirmCount}>{awayPlayers.length} players</Text>
              </View>
            </View>
            <View style={s.confirmDetails}>
              {location ? <Text style={s.confirmDetail}>📍 {location}</Text> : null}
              <Text style={s.confirmDetail}>📅 {date}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={create}>
            <Text style={s.btnText}>Create Game</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  stepLabel: { fontSize: 13, color: "#888" },
  progressTrack: { height: 3, backgroundColor: "#1a1a1a" },
  progressFill: { height: 3, backgroundColor: "#f5c518" },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  swatches: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  swatch: { width: 34, height: 34, borderRadius: 17 },
  swatchSelected: { borderWidth: 3, borderColor: "#fff" },
  btn: {
    backgroundColor: "#f5c518",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 16 },
  lineupContainer: { flex: 1 },
  lineupHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  teamHeaderText: { fontWeight: "700", fontSize: 14 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  playerName: { flex: 1, color: "#fff", fontWeight: "600", fontSize: 14 },
  playerPos: { color: "#888", fontSize: 12, width: 28 },
  sideButtons: { flexDirection: "row", gap: 8 },
  sideBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnText: { color: "#aaa", fontWeight: "700", fontSize: 13 },
  confirmCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  confirmTeams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  confirmTeam: { alignItems: "center", gap: 4, flex: 1 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  confirmTeamName: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center" },
  confirmCount: { color: "#888", fontSize: 12 },
  vsText: { color: "#555", fontWeight: "700", fontSize: 18 },
  confirmDetails: { gap: 6 },
  confirmDetail: { color: "#aaa", fontSize: 14 },
});
```

- [ ] **Step 2: Run app and verify**

Navigate via temporary button or direct URL `/create-game`. Complete all 3 steps — game should appear in the Games tab with status "Pending".

- [ ] **Step 3: Commit**

```bash
git add app/create-game.tsx
git commit -m "feat: add create-game 3-step wizard"
```

---

### Task 10: Wire "Add Player" button into players.tsx

**Files:**
- Modify: `app/(tabs)/players.tsx`

- [ ] **Step 1: Add router import to players.tsx**

At the top of `app/(tabs)/players.tsx`, add the import:
```typescript
import { useRouter } from "expo-router";
```

- [ ] **Step 2: Add router hook inside the main screen component**

Find the main screen component in `players.tsx` (the one that contains the `players` state and returns the full screen JSX). Add this line near the top of the component body, next to the other hooks:
```typescript
const router = useRouter();
```

- [ ] **Step 3: Find the existing "+" or "Add" button in players.tsx**

Search for the button that currently shows the add player UI (look for a `TouchableOpacity` with a `+` icon or similar near the top-right header area). Replace its `onPress` handler with:
```typescript
onPress={() => router.push("/create-player")}
```

If no such button exists yet, add one to the header area. Find the header section of the screen JSX and add:
```typescript
<TouchableOpacity onPress={() => router.push("/create-player")} style={{ padding: 8 }}>
  <Ionicons name="person-add" size={24} color="#f5c518" />
</TouchableOpacity>
```

- [ ] **Step 4: Run app and verify**

Tap the add button — the create-player modal should slide up. Add a player — it should appear in the list.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/players.tsx
git commit -m "feat: wire Add Player button to create-player modal"
```

---

### Task 11: Wire "Create Game" button into games.tsx

**Files:**
- Modify: `app/(tabs)/games.tsx`

- [ ] **Step 1: Add router import to games.tsx**

At the top of `app/(tabs)/games.tsx`, add:
```typescript
import { useRouter } from "expo-router";
```

- [ ] **Step 2: Add router hook inside the main screen component**

In the main `GamesScreen` component (search for the component that has `const { games, updateGame, deleteGame } = useStore()`), add:
```typescript
const router = useRouter();
```

- [ ] **Step 3: Find the existing "Create Game" button**

Search `games.tsx` for any button labeled "Create Game" or a `+` icon in the header. Replace its `onPress` with:
```typescript
onPress={() => router.push("/create-game")}
```

If no such button exists, find the header area of the screen and add:
```typescript
<TouchableOpacity onPress={() => router.push("/create-game")} style={{ padding: 8 }}>
  <Ionicons name="add-circle" size={28} color="#f5c518" />
</TouchableOpacity>
```

- [ ] **Step 4: Run app and verify**

Tap the create button — the create-game wizard should push onto the stack. Complete a game creation — it should appear in the games list.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/games.tsx
git commit -m "feat: wire Create Game button to create-game wizard"
```

---

### Task 12: Add .superpowers to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add entry**

Open `.gitignore` and add the following line:
```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```
