# Data Layer & CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded static data with a Zustand+AsyncStorage store, wire all four tabs to it, then add full create/edit/delete UI for players and games.

**Architecture:** Zustand `persist` middleware syncs state to AsyncStorage under the key `ballerz-store`. A single `store/index.ts` exports `useStore`. Thin selector hooks in `store/selectors.ts` encapsulate derived values. New form screens (`app/player/` and `app/game/`) are Expo Router stack routes pushed from the tab screens.

**Tech Stack:** Zustand, @react-native-async-storage/async-storage, expo-image-picker, Expo Router

---

## Task 1: Data layer foundation

**Files:**
- Modify: `types/players.ts`
- Create: `store/index.ts`
- Create: `store/selectors.ts`

- [ ] **Step 1: Install packages**

```bash
npx expo install zustand @react-native-async-storage/async-storage expo-image-picker
```

Expected: ends with `✔ Packages installed.`

- [ ] **Step 2: Add `photo` field to Player type**

`types/players.ts` — add `photo?: string` after `id`:

Old:
```ts
export type Player = {
  id: string;
  name: string;
```

New:
```ts
export type Player = {
  id: string;
  photo?: string;
  name: string;
```

- [ ] **Step 3: Create `store/index.ts`**

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Player } from "../types/players";
import type { Game } from "../types/games";

const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

interface BallerzStore {
  players: Player[];
  games: Game[];

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
}

export const useStore = create<BallerzStore>()(
  persist(
    (set) => ({
      players: [],
      games: [],

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
    }),
    {
      name: "ballerz-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

- [ ] **Step 4: Create `store/selectors.ts`**

```ts
import { useStore } from "./index";

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
  useStore((s) => ({
    gamesCount: s.games.length,
    playersCount: s.players.length,
    totalGoals: s.games.reduce(
      (sum, g) => sum + (g.homeScore ?? 0) + (g.awayScore ?? 0),
      0
    ),
  }));
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors. If it complains about missing zustand types, run `npx expo install` once more.

- [ ] **Step 6: Commit**

```bash
git add types/players.ts store/index.ts store/selectors.ts
git commit -m "feat: add Zustand+AsyncStorage store and selectors"
```

---

## Task 2: Wire all four tabs to the store

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/players.tsx`
- Modify: `app/(tabs)/games.tsx`
- Modify: `app/(tabs)/stats.tsx`

### 2a — Home screen (`app/(tabs)/index.tsx`)

The current file has `MatchCard`, `MVPHeroCard`, and `UpcomingCard` as zero-argument functions that close over module-level constants. These need to accept props so the screen can pass real data down.

- [ ] **Step 1: Refactor sub-components to accept props**

Replace the `MatchCard` signature (line ~84):

```ts
// Before
function MatchCard() {
  const g = lastGame;
// After
function MatchCard({ g }: { g: NonNullable<ReturnType<typeof import("../../store/selectors").useLastGame>> }) {
```

That type is verbose — simpler to use the imported `Game` type. Add `import type { Game } from "../../types/games"` at the top of the file, then:

```ts
function MatchCard({ g }: { g: Game }) {
  // body unchanged — already uses `g.` for everything
```

Replace the `MVPHeroCard` signature (line ~149). It currently reads `lastMVP.name`, `lastMVP.position`, `lastMVP.stat`. The player name/position come from the `Player` store; the stat comes from `lastGame.mvp.stat`. Add `import type { Player } from "../../types/players"` and:

```ts
function MVPHeroCard({ player, mvpStat }: { player: Player; mvpStat: string }) {
```

Inside the component body, replace `lastMVP.name` → `player.name`, `lastMVP.position` → `player.position`, `lastMVP.stat` → `mvpStat`.

Replace the `UpcomingCard` signature (line ~188):

```ts
function UpcomingCard({ g }: { g: Game }) {
  // body unchanged — already uses `g.` for everything
```

- [ ] **Step 2: Delete the module-level hardcoded constants**

Delete lines 18–52 (the `appStats`, `lastGame`, `upcomingGame`, `lastMVP` constant blocks).

- [ ] **Step 3: Wire `HomeScreen` to the store**

Add imports at the top of the file:

```ts
import { useStore } from "../../store";
import { useLastGame, useMvpPlayer, useAppStats } from "../../store/selectors";
import type { Game } from "../../types/games";
import type { Player } from "../../types/players";
```

Replace the `HomeScreen` function body to pull live data:

```ts
export default function HomeScreen() {
  const lastGame    = useLastGame();
  const mvpPlayer   = useMvpPlayer();
  const { gamesCount, playersCount, totalGoals } = useAppStats();
  const games       = useStore((s) => s.games);
  const nextGame    = games.find((g) => g.status === "Pending") ?? null;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Image
            source={require("@/assets/images/ballerzWideLogo.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <View style={s.seasonBadge}>
            <Text style={s.seasonText}>{SEASON}</Text>
          </View>
        </View>

        {/* ── Stats Strip ── */}
        <View style={s.statsRow}>
          {[
            { label: "Games",   value: String(gamesCount),   accent: "#4a9eff" },
            { label: "Players", value: String(playersCount), accent: "#a78bfa" },
            { label: "Goals",   value: String(totalGoals),   accent: "#f5c518" },
          ].map((stat, i) => (
            <View key={i} style={s.statChip}>
              <Text style={[s.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Last Match ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>LAST MATCH</Text>
          <TouchableOpacity>
            <Text style={s.sectionLink}>All games</Text>
          </TouchableOpacity>
        </View>
        {lastGame && <MatchCard g={lastGame} />}

        {/* ── MVP ── */}
        {mvpPlayer && lastGame && (
          <>
            <Text style={[s.sectionTitle, s.mvpSectionTitle]}>LAST MVP</Text>
            <MVPHeroCard player={mvpPlayer} mvpStat={lastGame.mvp.stat} />
          </>
        )}

        {/* ── Upcoming ── */}
        {nextGame && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>UPCOMING</Text>
            </View>
            <UpcomingCard g={nextGame} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Check UpcomingCard uses correct fields**

The existing `UpcomingCard` body reads `g.date`, `g.time`, `g.location`, `g.homeTeam`, `g.awayTeam`, `g.homeColor`, `g.awayColor`. The `Game` type has `date` and `location` but not `time` as a separate field. Change the date/time display in `UpcomingCard` to use only `g.date` (which will contain the full datetime string from the game wizard):

```tsx
// Before
<Text style={s.upcomingDateText}>{g.date} · {g.time}</Text>
// After
<Text style={s.upcomingDateText}>{g.date}</Text>
```

Also remove the TypeScript error by deleting any reference to `g.time`.

- [ ] **Step 5: Verify Home screen renders**

Start dev server (`npx expo start`). Home tab should render with 0/0/0 stats and no cards (store is empty). No crashes.

---

### 2b — Players screen (`app/(tabs)/players.tsx`)

- [ ] **Step 6: Import store and replace local state**

Add at top of `app/(tabs)/players.tsx`:

```ts
import { useStore } from "../../store";
```

In `PlayersScreen` (line ~499), replace:

```ts
const [players, setPlayers] = useState<Player[]>(initialPlayers);
```

With:

```ts
const { players, deletePlayer } = useStore();
```

Delete the `initialPlayers` array at lines 22–31.

Remove `useState` from the React import if it is no longer used elsewhere in the file — but check first since other state (`menuVisible`, `search`, etc.) still uses it.

- [ ] **Step 7: Replace `setPlayers` call in `confirmDelete`**

`confirmDelete` (line ~613):

```ts
// Before
setPlayers(prev => prev.filter(p => !selectedIds.has(p.id)));
// After
selectedIds.forEach((id) => deletePlayer(id));
```

The `mvpPlayer` derived value at line ~604 (`players.find(p => p.isMvp)`) continues to work unchanged — it reads from the live store array.

- [ ] **Step 8: Verify Players screen**

Players tab shows empty list. Sort, search, and card-flip interactions still work. No crashes.

---

### 2c — Games screen (`app/(tabs)/games.tsx`)

- [ ] **Step 9: Import store and replace local state**

Add at top of `app/(tabs)/games.tsx`:

```ts
import { useStore } from "../../store";
```

In `GamesScreen` (line ~2475), replace:

```ts
const [games, setGames] = useState<Game[]>(initialGames);
```

With:

```ts
const { games, updateGame, deleteGame } = useStore();
```

Delete the `initialGames` array. It starts at line 25 and runs for ~230 lines (4 full game objects). Delete from `const initialGames: Game[] = [` down to and including the closing `];`.

- [ ] **Step 10: Replace `setGames` in `confirmDelete` (line ~2545)**

```ts
// Before
setGames((prev) => prev.filter((g) => !selectedIds.has(g.id)));
// After
selectedIds.forEach((id) => deleteGame(id));
```

- [ ] **Step 11: Replace `setGames` in `markAllFinished` (line ~2552)**

```ts
// Before
setGames((prev) => prev.map((g) => ({ ...g, status: "FT" as const })));
// After
games
  .filter((g) => g.status !== "FT")
  .forEach((g) => updateGame(g.id, { status: "FT" }));
```

- [ ] **Step 12: Replace `setGames` in `handleTrackerFinish` (line ~2576)**

```ts
// Before
setGames((prev) =>
  prev.map((g) =>
    g.id === trackerGame.id
      ? { ...g, status: "FT" as const, homeScore, awayScore,
          mvp: { name: mvpName, stat: mvpStat }, goalEvents }
      : g
  )
);
// After
updateGame(trackerGame.id, {
  status: "FT",
  homeScore,
  awayScore,
  mvp: { name: mvpName, stat: mvpStat },
  goalEvents,
});
```

- [ ] **Step 13: Verify Games screen**

Games tab shows empty list. Filter tabs work. No crashes.

---

### 2d — Stats screen (`app/(tabs)/stats.tsx`)

- [ ] **Step 14: Import store and replace local constants**

Add at top of `app/(tabs)/stats.tsx`:

```ts
import { useStore } from "../../store";
```

At the top of the default export function body, add:

```ts
const { players, games } = useStore();
```

Delete the module-level `PLAYERS` and `GAMES` constant arrays (lines 16–~230). They are titled `// ─── Static data (mirrors players.tsx + games.tsx) ───`.

All `useMemo` hooks already reference `players` and `games` by those names — they will automatically use the store values once the module-level constants are removed.

- [ ] **Step 15: Verify Stats screen**

Stats tab shows zeroed leaderboards and empty dream team pitch. No crashes.

- [ ] **Step 16: Commit**

```bash
git add app/(tabs)/index.tsx app/(tabs)/players.tsx app/(tabs)/games.tsx app/(tabs)/stats.tsx
git commit -m "feat: wire all four tabs to Zustand store, delete hardcoded data"
```

---

> **Tasks 3–6 (navigation wiring, Add/Edit Player form, Create Game wizard, Edit Game screen) will be added in a follow-up planning session.**
