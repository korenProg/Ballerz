# New Game Form Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `app/create-game.tsx` as a 3-step wizard (Home team → Away team → Match details + Result) without changing what gets saved.

**Architecture:** `create-game.tsx` stays the single screen and the only store-touching code; it owns all field state plus new `step`/`showDatePicker` state and the unchanged `save()`. Step bodies become pure presentational components (`TeamStep` reused for home & away, `DetailsStep`), and the crest badge is extracted into a shared `Crest` component reused by the scoreboard and the wizard preview.

**Tech Stack:** React Native (Expo SDK 54), expo-router, Zustand, `@react-native-community/datetimepicker` (new), `expo-image-picker`, Ionicons, `T` tokens.

## Global Constraints

- **No test suite** (CLAUDE.md). Verification = `npm run lint` (must add no NEW errors) + manual check in the running app. Do NOT add a test runner. One pre-existing lint error exists in `app/onboarding.tsx` (`react/no-unescaped-entities`, line ~159) — ignore it; it is not yours.
- Use `T` tokens from `constants/theme.ts`; per-file `StyleSheet.create`; relative imports matching neighboring files.
- Date is stored in state as a `DD/MM/YYYY` string (unchanged across the app).
- **`save()` semantics are UNCHANGED** (copy the logic verbatim from the current file, shown in Task 5): create vs edit; upcoming (`status:"Pending"`, score 0, empty mvp) vs result (`status:"FT"` + score + optional mvp); lineup snapshots `{id,name,position}`; a player's `mvps` is bumped exactly once, **only** on a fresh create in result mode with a chosen MVP. **Edit never bumps `mvps`.**
- **Decomposition note:** the spec lists `HomeStep.tsx` + `AwayStep.tsx`; since they share an identical layout, this plan realizes them as a single reusable `components/wizard/TeamStep.tsx` (DRY). This supersedes the two-file split.
- TEAM_COLORS palette (verbatim): `["#0039a3", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0d9488", "#ca8a04", "#e11d48"]`.

**Reference types (already defined):**
```ts
type Player = { id: string; name: string; position: string; /* + attrs, mvps, ... */ };
// league: { name, color, logoUri, defaultLocation, defaultTeamSize, adminName }
```

---

### Task 1: Prerequisites — date-picker dependency + `parseDMY` helper

**Files:**
- Modify: `package.json` (via `expo install`)
- Modify: `utils/game.ts`

**Interfaces:**
- Produces: `parseDMY(date?: string): Date`

- [ ] **Step 1: Install the date picker** (Expo-managed, picks SDK-compatible version)

Run: `npx expo install @react-native-community/datetimepicker`
Expected: it's added to `package.json` dependencies; no errors.

- [ ] **Step 2: Add `parseDMY` to `utils/game.ts`** (append after the existing `parseGameDate`):

```ts
// Parse a DD/MM/YYYY string into a Date (for the native date picker).
// Falls back to today for empty/invalid input.
export function parseDMY(date?: string): Date {
  if (!date) return new Date();
  const [d, m, y] = date.split("/").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(dt.getTime()) ? new Date() : dt;
}
```

- [ ] **Step 3: Verify** — `npm run lint` passes (no new errors). `npx expo start` boots without a missing-module error for the picker.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json utils/game.ts
git commit -m "chore: add datetimepicker dep + parseDMY helper"
```

---

### Task 2: Extract `Crest` into a shared component

**Files:**
- Create: `components/Crest.tsx`
- Modify: `components/GameScoreboard.tsx` (remove local `Crest` + its `badge`/`badgeTxt` styles; import the shared one)

**Interfaces:**
- Consumes: `teamInitials` from `utils/game`.
- Produces: default export `Crest` with props `{ name: string; color: string; logo?: string; size: number }`.

- [ ] **Step 1: Create `components/Crest.tsx`**

```tsx
import { View, Text, Image, StyleSheet } from "react-native";
import { T } from "../constants/theme";
import { teamInitials } from "../utils/game";

export default function Crest({
  name, color, logo, size,
}: { name: string; color: string; logo?: string; size: number }) {
  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.badgeTxt, { fontSize: size * 0.34 }]}>{teamInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  badgeTxt: { fontWeight: "900", color: "#fff" },
});
```
(The unused `T` import is not needed — omit it; only import what's used: `View, Text, Image, StyleSheet` and `teamInitials`.)

- [ ] **Step 2: Update `components/GameScoreboard.tsx`** — delete the local `function Crest(...) {...}` block and the `badge` / `badgeTxt` keys from its `StyleSheet.create`, and add at the top:

```tsx
import Crest from "./Crest";
```
Leave every `<Crest ... />` usage as-is (same props).

- [ ] **Step 3: Verify** — `npm run lint` passes. `npm start`, open Home/Games: cards render identically (logo crest or colored-initials badge).

- [ ] **Step 4: Commit**

```bash
git add components/Crest.tsx components/GameScoreboard.tsx
git commit -m "refactor: extract shared Crest component"
```

---

### Task 3: `TeamStep` presentational component

**Files:**
- Create: `components/wizard/TeamStep.tsx`

**Interfaces:**
- Consumes: `Crest` from `../Crest`; `Player` type.
- Produces: default export `TeamStep` with this exact prop type (used by `create-game.tsx` in Task 5):
  ```ts
  type TeamStepProps = {
    stepNum: 1 | 2;
    sideLabel: "Home" | "Away";
    colors: string[];
    name: string; onName: (s: string) => void;
    color: string; onColor: (c: string) => void;
    logo: string | null; onPickLogo: () => void; onClearLogo: () => void;
    players: Player[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    defaultTeamSize: number;
    onAddPlayers: () => void;
  };
  ```

- [ ] **Step 1: Create `components/wizard/TeamStep.tsx`**

```tsx
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "../Crest";
import { T } from "../../constants/theme";
import type { Player } from "../../types/players";

type TeamStepProps = {
  stepNum: 1 | 2;
  sideLabel: "Home" | "Away";
  colors: string[];
  name: string; onName: (s: string) => void;
  color: string; onColor: (c: string) => void;
  logo: string | null; onPickLogo: () => void; onClearLogo: () => void;
  players: Player[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  defaultTeamSize: number;
  onAddPlayers: () => void;
};

export default function TeamStep({
  stepNum, sideLabel, colors, name, onName, color, onColor,
  logo, onPickLogo, onClearLogo, players, selectedIds, onToggle,
  defaultTeamSize, onAddPlayers,
}: TeamStepProps) {
  return (
    <View>
      <Text style={styles.eyebrow}>STEP {stepNum} OF 3</Text>
      <Text style={styles.title}>{sideLabel} team</Text>
      <Text style={styles.sub}>Set up the {sideLabel.toLowerCase()} side.</Text>

      <View style={styles.preview}>
        <Crest name={name || sideLabel} color={color} logo={logo ?? undefined} size={96} />
        <Text style={styles.previewName} numberOfLines={1}>{name || sideLabel}</Text>
      </View>

      <Text style={styles.label}>Team name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onName}
        placeholder={sideLabel === "Home" ? "e.g. Reds" : "e.g. Blues"}
        placeholderTextColor={T.textMuted}
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.swatchRow}>
        {colors.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
            activeOpacity={0.8}
            onPress={() => onColor(c)}
          >
            {color === c ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Logo (optional)</Text>
      <View style={styles.logoRow}>
        <TouchableOpacity style={styles.logoSlot} activeOpacity={0.8} onPress={onPickLogo}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logoSlotImg} resizeMode="contain" />
          ) : (
            <Ionicons name="image-outline" size={20} color={T.textSecondary} />
          )}
        </TouchableOpacity>
        {logo ? (
          <TouchableOpacity onPress={onClearLogo} hitSlop={8}>
            <Text style={styles.clearTxt}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.label}>
        Squad (optional · {defaultTeamSize}v{defaultTeamSize} · {selectedIds.length} selected)
      </Text>
      {players.length === 0 ? (
        <TouchableOpacity onPress={onAddPlayers}>
          <Text style={styles.hintLink}>No players yet — add players first</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.chipWrap}>
          {players.map((p) => {
            const on = selectedIds.includes(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, on && { backgroundColor: color, borderColor: color }]}
                activeOpacity={0.8}
                onPress={() => onToggle(p.id)}
              >
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{p.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary, marginTop: 4 },
  sub: { fontSize: 13, color: T.textSecondary, marginBottom: 8 },
  preview: { alignItems: "center", gap: 8, marginTop: 14, marginBottom: 6 },
  previewName: { fontSize: 16, fontWeight: "800", color: T.textPrimary, maxWidth: 220 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.textPrimary },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  swatchActive: { borderWidth: 2, borderColor: T.textPrimary },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  logoSlot: { width: 56, height: 56, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoSlotImg: { width: "100%", height: "100%" },
  clearTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary, textDecorationLine: "underline" },
  hintLink: { fontSize: 13, color: T.textSecondary, textDecorationLine: "underline" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
});
```

- [ ] **Step 2: Verify** — `npm run lint` passes. (Rendered in Task 5.)

- [ ] **Step 3: Commit** — `git add components/wizard/TeamStep.tsx && git commit -m "feat: wizard TeamStep component (team + squad + live crest)"`

---

### Task 4: `DetailsStep` presentational component

**Files:**
- Create: `components/wizard/DetailsStep.tsx`

**Interfaces:**
- Consumes: `Crest` from `../Crest`.
- Produces: default export `DetailsStep` with this exact prop type (used in Task 5):
  ```ts
  type DetailsStepProps = {
    homeTeam: string; awayTeam: string;
    homeColor: string; awayColor: string;
    homeLogo: string | null; awayLogo: string | null;
    mode: "upcoming" | "result"; onMode: (m: "upcoming" | "result") => void;
    dateLabel: string; onOpenDate: () => void;
    location: string; onLocation: (s: string) => void;
    homeScore: number; onHomeScore: (n: number) => void;
    awayScore: number; onAwayScore: (n: number) => void;
    lineup: { id: string; name: string }[];
    mvpId: string | null; onMvp: (id: string | null) => void;
    mvpStat: string; onMvpStat: (s: string) => void;
  };
  ```

- [ ] **Step 1: Create `components/wizard/DetailsStep.tsx`**

```tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "../Crest";
import { T } from "../../constants/theme";

type DetailsStepProps = {
  homeTeam: string; awayTeam: string;
  homeColor: string; awayColor: string;
  homeLogo: string | null; awayLogo: string | null;
  mode: "upcoming" | "result"; onMode: (m: "upcoming" | "result") => void;
  dateLabel: string; onOpenDate: () => void;
  location: string; onLocation: (s: string) => void;
  homeScore: number; onHomeScore: (n: number) => void;
  awayScore: number; onAwayScore: (n: number) => void;
  lineup: { id: string; name: string }[];
  mvpId: string | null; onMvp: (id: string | null) => void;
  mvpStat: string; onMvpStat: (s: string) => void;
};

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(0, value - 1))}><Ionicons name="remove" size={18} color={T.textPrimary} /></TouchableOpacity>
      <Text style={styles.stepVal}>{value}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(value + 1)}><Ionicons name="add" size={18} color={T.textPrimary} /></TouchableOpacity>
    </View>
  );
}

export default function DetailsStep({
  homeTeam, awayTeam, homeColor, awayColor, homeLogo, awayLogo,
  mode, onMode, dateLabel, onOpenDate, location, onLocation,
  homeScore, onHomeScore, awayScore, onAwayScore, lineup, mvpId, onMvp, mvpStat, onMvpStat,
}: DetailsStepProps) {
  return (
    <View>
      <Text style={styles.eyebrow}>STEP 3 OF 3</Text>
      <Text style={styles.title}>Match details</Text>
      <Text style={styles.sub}>Confirm and save.</Text>

      {/* Summary preview */}
      <View style={styles.preview}>
        <View style={styles.previewTeam}>
          <Crest name={homeTeam || "Home"} color={homeColor} logo={homeLogo ?? undefined} size={44} />
          <Text style={styles.previewName} numberOfLines={1}>{homeTeam || "Home"}</Text>
        </View>
        <Text style={styles.previewMid}>{mode === "result" ? `${homeScore} : ${awayScore}` : "vs"}</Text>
        <View style={styles.previewTeam}>
          <Crest name={awayTeam || "Away"} color={awayColor} logo={awayLogo ?? undefined} size={44} />
          <Text style={styles.previewName} numberOfLines={1}>{awayTeam || "Away"}</Text>
        </View>
      </View>

      {/* Mode */}
      <View style={styles.segment}>
        {(["upcoming", "result"] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnActive]} activeOpacity={0.8} onPress={() => onMode(m)}>
            <Text style={[styles.segTxt, mode === m && styles.segTxtActive]}>{m === "upcoming" ? "Upcoming" : "Log result"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.input} activeOpacity={0.8} onPress={onOpenDate}>
        <Text style={styles.inputTxt}>{dateLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={onLocation} placeholder="e.g. City Park (optional)" placeholderTextColor={T.textMuted} />

      {mode === "result" && (
        <>
          <Text style={styles.label}>Final score</Text>
          <View style={styles.scoreRow}>
            <Stepper value={homeScore} onChange={onHomeScore} />
            <Text style={styles.scoreColon}>:</Text>
            <Stepper value={awayScore} onChange={onAwayScore} />
          </View>

          <Text style={styles.label}>MVP (optional)</Text>
          {lineup.length === 0 ? (
            <Text style={styles.hint}>Add players to a lineup to pick an MVP</Text>
          ) : (
            <View style={styles.chipWrap}>
              {lineup.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.chip, mvpId === p.id && styles.chipMvpOn]} activeOpacity={0.8} onPress={() => onMvp(mvpId === p.id ? null : p.id)}>
                  <Text style={[styles.chipTxt, mvpId === p.id && styles.chipTxtOn]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {mvpId ? (
            <TextInput style={[styles.input, { marginTop: 10 }]} value={mvpStat} onChangeText={onMvpStat} placeholder="MVP stat, e.g. 2 goals" placeholderTextColor={T.textMuted} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: "800", color: T.textSecondary, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: "900", color: T.textPrimary, marginTop: 4 },
  sub: { fontSize: 13, color: T.textSecondary, marginBottom: 8 },
  preview: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginTop: 12 },
  previewTeam: { flex: 1, alignItems: "center", gap: 6 },
  previewName: { fontSize: 13, fontWeight: "700", color: T.textPrimary, maxWidth: 110, textAlign: "center" },
  previewMid: { fontSize: 18, fontWeight: "900", color: T.textPrimary, paddingHorizontal: 10 },
  label: { fontSize: 12, fontWeight: "800", color: T.textSecondary, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  inputTxt: { fontSize: 15, color: T.textPrimary },
  segment: { flexDirection: "row", backgroundColor: T.surface, borderRadius: 12, padding: 4, marginTop: 16 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  segBtnActive: { backgroundColor: T.border },
  segTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  segTxtActive: { color: T.textPrimary },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 6 },
  scoreColon: { fontSize: 24, fontWeight: "900", color: T.textPrimary },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.border, alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 20, fontWeight: "900", color: T.textPrimary, minWidth: 24, textAlign: "center" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipTxt: { fontSize: 13, fontWeight: "700", color: T.textSecondary },
  chipTxtOn: { color: "#fff" },
  chipMvpOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },
  hint: { fontSize: 13, color: T.textSecondary },
});
```

- [ ] **Step 2: Verify** — `npm run lint` passes. (Rendered in Task 5.)

- [ ] **Step 3: Commit** — `git add components/wizard/DetailsStep.tsx && git commit -m "feat: wizard DetailsStep component (mode, date, location, result)"`

---

### Task 5: Rewrite `create-game.tsx` as the wizard

**Files:**
- Modify: `app/create-game.tsx` (full rewrite of render + add step/date-picker state; keep `save()`/`toggle()`/`snapshot()` logic)

**Interfaces:**
- Consumes: `TeamStep`, `DetailsStep`, `Crest` (indirectly), `parseDMY`/`formatDate` from `utils/game`, `DateTimePicker`.

- [ ] **Step 1: Replace `app/create-game.tsx`** with:

```tsx
import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store";
import { formatDate, parseDMY } from "../utils/game";
import { T } from "../constants/theme";
import TeamStep from "../components/wizard/TeamStep";
import DetailsStep from "../components/wizard/DetailsStep";

const TEAM_COLORS = ["#0039a3", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0d9488", "#ca8a04", "#e11d48"];

export default function CreateGameScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const league = useStore((s) => s.league);
  const addGame = useStore((s) => s.addGame);
  const updateGame = useStore((s) => s.updateGame);
  const players = useStore((s) => s.players);
  const setMvp = useStore((s) => s.setMvp);
  const updatePlayer = useStore((s) => s.updatePlayer);
  const editing = useStore((s) => (id ? s.games.find((g) => g.id === id) ?? null : null));

  const [step, setStep] = useState(0);
  const [showDate, setShowDate] = useState(false);
  const [homeTeam, setHomeTeam] = useState(editing?.homeTeam ?? "");
  const [awayTeam, setAwayTeam] = useState(editing?.awayTeam ?? "");
  const [homeColor, setHomeColor] = useState(editing?.homeColor ?? league.color);
  const [awayColor, setAwayColor] = useState(editing?.awayColor ?? TEAM_COLORS[1]);
  const [date, setDate] = useState(editing?.date ?? formatDate(new Date()));
  const [location, setLocation] = useState(editing?.location ?? league.defaultLocation ?? "");
  const [homeLogo, setHomeLogo] = useState<string | null>(editing?.homeLogo ?? null);
  const [awayLogo, setAwayLogo] = useState<string | null>(editing?.awayLogo ?? null);
  const [homePlayerIds, setHomePlayerIds] = useState<string[]>(editing?.homePlayers?.map((p) => p.id) ?? []);
  const [awayPlayerIds, setAwayPlayerIds] = useState<string[]>(editing?.awayPlayers?.map((p) => p.id) ?? []);
  const [mode, setMode] = useState<"upcoming" | "result">(editing?.status === "FT" ? "result" : "upcoming");
  const [homeScore, setHomeScore] = useState(editing?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(editing?.awayScore ?? 0);
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [mvpStat, setMvpStat] = useState(editing?.mvp?.stat ?? "");

  const toggle = (side: "home" | "away", pid: string) => {
    if (side === "home") {
      setAwayPlayerIds((a) => a.filter((x) => x !== pid));
      setHomePlayerIds((h) => (h.includes(pid) ? h.filter((x) => x !== pid) : [...h, pid]));
    } else {
      setHomePlayerIds((h) => h.filter((x) => x !== pid));
      setAwayPlayerIds((a) => (a.includes(pid) ? a.filter((x) => x !== pid) : [...a, pid]));
    }
  };

  const snapshot = (ids: string[]) =>
    ids
      .map((pid) => players.find((p) => p.id === pid))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({ id: p.id, name: p.name, position: p.position }));

  const lineup = [...homePlayerIds, ...awayPlayerIds]
    .map((pid) => players.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.id, name: p.name }));

  async function pickLogo(set: (uri: string) => void) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) set(res.assets[0].uri);
  }

  function save() {
    const base = {
      league: league.name,
      homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim(),
      homeColor, awayColor, date, location: location.trim(),
      homeLogo: homeLogo ?? undefined,
      awayLogo: awayLogo ?? undefined,
      homePlayers: snapshot(homePlayerIds), awayPlayers: snapshot(awayPlayerIds),
    };
    if (editing) {
      if (mode === "result") {
        const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
        updateGame(editing.id, { ...base, status: "FT", homeScore, awayScore, mvp: { name: mvpPlayer?.name ?? editing.mvp.name, stat: mvpPlayer ? mvpStat.trim() : editing.mvp.stat } });
      } else {
        updateGame(editing.id, { ...base, status: "Pending", homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } });
      }
      router.back();
      return;
    }
    if (mode === "result") {
      const mvpPlayer = mvpId ? players.find((p) => p.id === mvpId) : null;
      addGame({ ...base, status: "FT", homeScore, awayScore, mvp: { name: mvpPlayer?.name ?? "", stat: mvpPlayer ? mvpStat.trim() : "" } });
      if (mvpPlayer) {
        setMvp(mvpPlayer.id);
        updatePlayer(mvpPlayer.id, { mvps: mvpPlayer.mvps + 1 });
      }
    } else {
      addGame({ ...base, status: "Pending", homeScore: 0, awayScore: 0, mvp: { name: "", stat: "" } });
    }
    router.back();
  }

  const canContinue =
    step === 0 ? homeTeam.trim().length > 0 : step === 1 ? awayTeam.trim().length > 0 : true;
  const dateLabel = parseDMY(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  function next() {
    if (step < 2) { setStep(step + 1); return; }
    if (canContinue) save();
  }

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={T.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editing ? "Edit Game" : "New Game"}</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.progressSeg, i <= step && styles.progressSegActive]}
              disabled={i >= step}
              hitSlop={8}
              onPress={() => setStep(i)}
            />
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <TeamStep
              stepNum={1} sideLabel="Home" colors={TEAM_COLORS}
              name={homeTeam} onName={setHomeTeam} color={homeColor} onColor={setHomeColor}
              logo={homeLogo} onPickLogo={() => pickLogo(setHomeLogo)} onClearLogo={() => setHomeLogo(null)}
              players={players} selectedIds={homePlayerIds} onToggle={(pid) => toggle("home", pid)}
              defaultTeamSize={league.defaultTeamSize} onAddPlayers={() => router.push("/create-player")}
            />
          )}
          {step === 1 && (
            <TeamStep
              stepNum={2} sideLabel="Away" colors={TEAM_COLORS}
              name={awayTeam} onName={setAwayTeam} color={awayColor} onColor={setAwayColor}
              logo={awayLogo} onPickLogo={() => pickLogo(setAwayLogo)} onClearLogo={() => setAwayLogo(null)}
              players={players} selectedIds={awayPlayerIds} onToggle={(pid) => toggle("away", pid)}
              defaultTeamSize={league.defaultTeamSize} onAddPlayers={() => router.push("/create-player")}
            />
          )}
          {step === 2 && (
            <DetailsStep
              homeTeam={homeTeam} awayTeam={awayTeam} homeColor={homeColor} awayColor={awayColor}
              homeLogo={homeLogo} awayLogo={awayLogo}
              mode={mode} onMode={setMode}
              dateLabel={dateLabel} onOpenDate={() => setShowDate(true)}
              location={location} onLocation={setLocation}
              homeScore={homeScore} onHomeScore={setHomeScore} awayScore={awayScore} onAwayScore={setAwayScore}
              lineup={lineup} mvpId={mvpId} onMvp={setMvpId} mvpStat={mvpStat} onMvpStat={setMvpStat}
            />
          )}
        </ScrollView>

        {showDate && (
          <DateTimePicker
            value={parseDMY(date)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
              setShowDate(false);
              if (event.type === "set" && selected) setDate(formatDate(selected));
            }}
          />
        )}

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => setStep(step - 1)}>
              <Text style={styles.backTxt}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.nextBtn, !canContinue && styles.nextDisabled]} activeOpacity={0.8} disabled={!canContinue} onPress={next}>
            <Text style={styles.nextTxt}>
              {step < 2 ? "Continue" : mode === "result" ? "Save Result" : "Create Game"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: T.textPrimary },
  progressRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: T.surface },
  progressSegActive: { backgroundColor: T.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  backBtn: { paddingVertical: 15, paddingHorizontal: 22, borderRadius: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: "center" },
  backTxt: { fontSize: 14, fontWeight: "800", color: T.textPrimary },
  nextBtn: { flex: 1, backgroundColor: T.textPrimary, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  nextDisabled: { opacity: 0.4 },
  nextTxt: { fontSize: 14, fontWeight: "800", color: T.bg },
});
```

- [ ] **Step 2: Verify (full manual walk-through)** — `npm start`:
  1. Games → `+` → **Step 1 Home**: type name, pick color/logo, select squad; crest preview updates; Continue disabled until name set.
  2. **Step 2 Away**: same; a player picked for home is removed if picked for away.
  3. **Step 3 Details**: summary shows the matchup; tap Date → native picker (iOS spinner / Android dialog) → date updates; toggle **Log result** → score steppers + MVP chips appear; pick MVP + stat.
  4. **Save Result** → game appears under RESULTS as FT with score; MVP's `mvps` +1 exactly once. Repeat with **Upcoming** → appears under UPCOMING.
  5. **Edit** an existing game (open detail → Edit): prefilled; jump via progress segments; save updates in place (no duplicate, no MVP re-bump).
  6. **Back** moves to the previous step; header **✕** exits the form.

- [ ] **Step 3: Commit**

```bash
git add app/create-game.tsx
git commit -m "feat: create-game as 3-step wizard (Home/Away/Details) with date picker"
```

---

## Self-Review notes (addressed)

- **Spec coverage:** 3-step wizard + progress bar + footer nav (T5); Home/Away as TeamStep with live crest + squad (T3, T5); Details + mode + native date + location + result score/MVP (T4, T5); shared Crest (T2); parseDMY + date-picker dep (T1); save() unchanged incl. once-only MVP bump and no-bump-on-edit (T5, verbatim from current file); edit prefill + progress jump (T5); empty-roster link (T3); validation per step (T5).
- **Type consistency:** `TeamStepProps` and `DetailsStepProps` prop names match the `create-game.tsx` call sites in T5; `lineup` is `{id,name}[]` in both producer (T5) and consumer (T4).
- **No-test adaptation:** every task ends with `npm run lint` + manual verification + commit.
- **Decomposition deviation noted:** single `TeamStep` replaces spec's `HomeStep`+`AwayStep` (DRY) — documented in Global Constraints.
