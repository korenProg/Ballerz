# FotMob-style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every Ballerz screen to a calm, FotMob-style dark UI — black page, borderless grey cards, normal weights, one green accent, dense rows — and fix the Home "last game shows a future fixture" bug.

**Architecture:** Task 1 swaps the palette in `constants/theme.ts` and remaps the old token names onto it, so the whole app re-skins at once without breaking any import. Task 2 adds a small UI kit in `components/ui/`. Tasks 3–7 rebuild screens on that kit one per commit; Task 7 deletes the legacy token names. Pure logic (rating bands, next-match pick, head-to-head) lives in import-free files under `utils/` and is tested with Node's built-in test runner.

**Tech Stack:** Expo SDK 57, React Native 0.86, expo-router (typed routes), Zustand, React Compiler, `StyleSheet.create`. Tests: `node --test` (Node 24 strips TypeScript natively — no new dependency).

**Spec:** `docs/superpowers/specs/2026-10-13-fotmob-redesign-design.md`

## Global Constraints

- No new runtime or dev dependencies. System font only.
- Palette exactly: `bg #000000`, `surface #1A1A1A`, `surfaceAlt #262626`, `divider #2B2B2B`, `text #F2F2F2`, `textDim #A3A3A3`, `textFaint #8A8A8A`, `accent #2FD47A`, `red #F04438`, `yellow #F5C518`.
- Rating bands exactly: ≥80 `#2FD47A`, ≥70 `#A3E635`, ≥60 `#F5C518`, else `#F97316`; badge text black.
- Font weights 400 / 500 / 600 / 700 only. Every number uses `fontVariant: ["tabular-nums"]`.
- Card radius 16, padding 16; badge radius 8; control radius 12; spacing 4 / 8 / 12 / 16 / 20 / 24 / 32. Cards have no border.
- League colour appears on crests only.
- React Compiler rules: never read or write a ref during render. No manual `useMemo`/`useCallback` outside `store/selectors.ts`.
- New and rewritten code uses `Pressable`, not `TouchableOpacity`.
- Dates are `DD/MM/YYYY`; compare with `parseGameDate`, never `new Date(dateString)`.
- `utils/game.ts` and `utils/rating.ts` stay import-free so `node --test` can load them.
- Store actions, routes and the data model do not change.
- Run exactly one Metro dev server. Before starting one, run `netstat -ano | grep LISTENING | grep -E ":808[0-9]"`; if a server is already listening, use its port for every `curl` and screenshot below (the commands say `8081`; substitute the live port).

## Review Focus

1. **Undated upcoming games** — Home's "Next match" must pick the soonest *dated* fixture; an undated one wins only when nothing is dated. Pinned in Task 1 (`pickNextGame` tests).
2. **Head-to-head when home/away swap** — wins are credited to the team that won, not to "whoever was at home", and a tie highlights neither side. Pinned in Task 5 (`computeRivalry` tests) and the Task 5 screenshot check.
3. **Long names** — a 26-character team or player name truncates to one line and never pushes the score, OVR badge or chevron off-screen. Pinned in the Task 3, 5 and 6 screenshot checks, which seed long names.
4. **Empty data** — zero games, zero players, and a tab filter with no matches each show a message (and an action where one exists), never a blank screen. Pinned in the Task 3, 5 and 6 empty-storage screenshot checks.
5. **Rating boundaries** — 80/79, 70/69, 60/59, 0 and `NaN` land in the right band. Pinned in Task 1 (`ratingColor` tests).

## Shared procedures

These are referenced by name from task steps. They are fixed commands, not suggestions.

**`VERIFY`** — run all four; every one must pass before a commit:

```bash
npm run check                 # Expected: "ℹ fail 0"
npm run lint                  # Expected: no problems listed after "> expo lint"
npx tsc --noEmit              # Expected: no output
curl -s -o /dev/null -w "%{http_code}\n" --max-time 400 \
  "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false"
                              # Expected: 200
```

**`SEED`** — Playwright `browser_evaluate` on `http://localhost:8081/` at viewport 390×844, then reload. This is the default fixture: 8 players (two with long names), 3 games including a long team name, one rivalry played twice with home/away swapped.

```js
() => {
  const mk = (id, name, position, foot, form, a, goals, assists, mvps, isMvp) => {
    const [pac, sho, pas, dri, def, phy] = a;
    return { id, name, position, foot, form, pac, sho, pas, dri, def, phy,
      ovr: Math.round((pac + sho + pas + dri + def + phy) / 6), goals, assists, mvps, isMvp };
  };
  const players = [
    mk("p1", "Daniel Cohen", "FWD", "R", "hot", [86, 84, 70, 81, 38, 72], 14, 5, 4, true),
    mk("p2", "Omer Levi", "MID", "R", "neutral", [72, 68, 82, 78, 60, 66], 6, 11, 2, false),
    mk("p3", "Yossi Mizrahi", "DEF", "L", "cold", [64, 40, 58, 52, 80, 82], 1, 2, 0, false),
    mk("p4", "Amit Shapira", "GK", "R", "neutral", [48, 30, 55, 40, 74, 70], 0, 0, 1, false),
    mk("p5", "Noam Peretz", "MID", "L", "hot", [78, 72, 79, 83, 55, 61], 8, 7, 3, false),
    mk("p6", "Itay Ben David-Abergel", "DEF", "R", "neutral", [70, 45, 62, 58, 76, 79], 2, 1, 0, false),
    mk("p7", "Eitan Golan", "FWD", "R", "neutral", [80, 77, 60, 74, 35, 68], 9, 3, 1, false),
    mk("p8", "Roi Avraham", "MID", "R", "cold", [66, 60, 71, 69, 58, 63], 3, 4, 0, false),
  ];
  const gp = (p) => ({ id: p.id, name: p.name, position: p.position });
  const games = [
    { id: "g1", date: "04/10/2026", league: "Sunday League", status: "FT", homeTeam: "Lions", awayTeam: "Wolves",
      homeScore: 4, awayScore: 2, mvp: { name: "Daniel Cohen", stat: "2 goals, 1 assist" },
      homeColor: "#dc2626", awayColor: "#0039a3", location: "Ramat Gan Park",
      homePlayers: players.slice(0, 4).map(gp), awayPlayers: players.slice(4).map(gp) },
    { id: "g2", date: "11/10/2026", league: "Sunday League", status: "FT", homeTeam: "Wolves", awayTeam: "Lions",
      homeScore: 3, awayScore: 1, mvp: { name: "Noam Peretz", stat: "1 goal, 2 assists" },
      homeColor: "#0039a3", awayColor: "#dc2626", location: "Ramat Gan Park",
      homePlayers: players.slice(4).map(gp), awayPlayers: players.slice(0, 4).map(gp) },
    { id: "g3", date: "18/10/2026", league: "Sunday League", status: "Pending",
      homeTeam: "Hapoel Ramat Gan Givatayim", awayTeam: "Lions", homeScore: 0, awayScore: 0,
      mvp: { name: "", stat: "" }, homeColor: "#059669", awayColor: "#dc2626", location: "Ramat Gan Park" },
  ];
  const state = { players, games, hasOnboarded: true,
    league: { name: "Sunday League", logoUri: null, color: "#059669",
      defaultLocation: "Ramat Gan Park", defaultTeamSize: 5, adminName: "Koren" } };
  localStorage.setItem("ballerz-store", JSON.stringify({ state, version: 0 }));
  return "seeded";
}
```

**`SEED-EMPTY`** — same as `SEED` but with this state, then reload:

```js
() => {
  const state = { players: [], games: [], hasOnboarded: true,
    league: { name: "Sunday League", logoUri: null, color: "#059669",
      defaultLocation: "", defaultTeamSize: 5, adminName: "Koren" } };
  localStorage.setItem("ballerz-store", JSON.stringify({ state, version: 0 }));
  return "seeded empty";
}
```

**`SHOT <route> <name>`** — Playwright `browser_navigate` to `http://localhost:8081<route>`, then `browser_take_screenshot` with `filename: ".playwright-mcp/<name>.png"` and `fullPage: true`, then `Read` the PNG and check it against the task's "Expected on screen" list. `.playwright-mcp/` is gitignored.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `constants/theme.ts` | Modify | Palette `T`, `SPACE`, `RADIUS`, `TYPE`; legacy aliases until Task 7 |
| `utils/rating.ts` | Create | `ratingColor(value)` — band colour for an OVR/rating |
| `utils/game.ts` | Modify | Add `shortDate`, `pickNextGame` (Task 1), `computeRivalry` (Task 5) |
| `scripts/checks/rating.test.mjs` | Create | Tests for `ratingColor` |
| `scripts/checks/game.test.mjs` | Create | Tests for `shortDate`, `pickNextGame`, `computeRivalry` |
| `package.json` | Modify | `"check"` script |
| `components/ui/IconButton.tsx` | Create | 40×40 icon button, plain or accent-filled |
| `components/ui/ScreenHeader.tsx` | Create | Solid left-aligned header with leading/title/subtitle/action |
| `components/ui/Section.tsx` | Create | Borderless grey card with optional title and footer action |
| `components/ui/ListRow.tsx` | Create | 64-tall row: leading, title (+badge), subtitle, trailing, divider |
| `components/ui/Tabs.tsx` | Create | Underline tabs with green indicator |
| `components/ui/RatingBadge.tsx` | Create | Band-coloured number badge |
| `components/ui/StatCompare.tsx` | Create | Left value · label · right value, winner in team colour |
| `components/ui/Button.tsx` | Create | primary / secondary / destructive button |
| `components/ui/EmptyState.tsx` | Create | Icon, title, sub, optional action |
| `components/Crest.tsx` | Modify | Add `variant="avatar"`; weights 700 |
| `components/GameCard.tsx` | Rewrite | Compact match row |
| `components/GameScoreboard.tsx` | Rewrite | Card-less match header |
| `app/(tabs)/games.tsx` | Rewrite | SectionList of match rows under Tabs |
| `app/game/[id].tsx` | Rewrite | Match header, live controls, Lineups, Details |
| `store/selectors.ts` | Modify | `useNextGame`; `useRivalry` uses `computeRivalry` |
| `app/(tabs)/index.tsx` | Rewrite | Home |
| `app/(tabs)/players.tsx` | Rewrite | Roster |
| `app/player/[id].tsx` | Rewrite | Player detail |
| `app/(tabs)/league.tsx` | Rewrite | League settings |
| `app/(tabs)/_layout.tsx` | Modify | Tab bar colours |
| 6 form files | Modify | Weight sweep, accent CTAs, yellow MVP chips |
| `CLAUDE.md`, `.claude/skills/building-ballerz-screens/SKILL.md` | Modify | Document the new system |

---

### Task 1: Palette, tokens, and tested pure helpers

**Files:**
- Modify: `constants/theme.ts` (whole file)
- Create: `utils/rating.ts`
- Modify: `utils/game.ts` (append)
- Create: `scripts/checks/rating.test.mjs`, `scripts/checks/game.test.mjs`
- Modify: `package.json` (`scripts`)

**Interfaces:**
- Produces: `T` (keys `bg surface surfaceAlt divider text textDim textFaint accent red yellow` + legacy `border textPrimary textSecondary textMuted`), `SPACE`, `RADIUS`, `TYPE`, `LEAGUE_COLORS`, `TEAM_SIZES`, `Colors`, `Fonts` from `constants/theme.ts`; `ratingColor(value: number): string` from `utils/rating.ts`; `shortDate(date?: string): string` and `pickNextGame<G extends { status: string; date?: string }>(games: readonly G[]): G | null` from `utils/game.ts`.

- [ ] **Step 1: Add the check script**

In `package.json`, add to `"scripts"` (after `"lint"`):

```json
    "check": "node --test \"scripts/checks/*.test.mjs\""
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/checks/rating.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ratingColor } from "../../utils/rating.ts";

test("rating bands switch exactly at 80, 70 and 60", () => {
  assert.equal(ratingColor(99), "#2FD47A");
  assert.equal(ratingColor(80), "#2FD47A");
  assert.equal(ratingColor(79), "#A3E635");
  assert.equal(ratingColor(70), "#A3E635");
  assert.equal(ratingColor(69), "#F5C518");
  assert.equal(ratingColor(60), "#F5C518");
  assert.equal(ratingColor(59), "#F97316");
  assert.equal(ratingColor(0), "#F97316");
});

test("a non-number rating falls to the lowest band instead of throwing", () => {
  assert.equal(ratingColor(Number.NaN), "#F97316");
});
```

Create `scripts/checks/game.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNextGame, shortDate } from "../../utils/game.ts";

const g = (id, status, date) => ({ id, status, date });

test("shortDate formats DD/MM/YYYY", () => {
  assert.equal(shortDate("18/10/2026"), "18 Oct");
  assert.equal(shortDate("01/01/2027"), "1 Jan");
});

test("shortDate returns TBD for missing or malformed dates", () => {
  assert.equal(shortDate(undefined), "TBD");
  assert.equal(shortDate(""), "TBD");
  assert.equal(shortDate("31/13/2026"), "TBD");
  assert.equal(shortDate("abc"), "TBD");
});

test("next game is a live game when one exists", () => {
  const games = [g("p", "Pending", "13/10/2026"), g("l", "Live", "20/10/2026")];
  assert.equal(pickNextGame(games)?.id, "l");
});

test("next game is the soonest dated fixture, including days past the 12th", () => {
  const games = [g("a", "Pending", "20/10/2026"), g("b", "Pending", "13/10/2026"), g("c", "FT", "01/10/2026")];
  assert.equal(pickNextGame(games)?.id, "b");
});

test("undated fixtures rank after dated ones", () => {
  assert.equal(pickNextGame([g("u", "Pending", undefined), g("d", "Pending", "30/12/2026")])?.id, "d");
  assert.equal(pickNextGame([g("u", "Pending", undefined)])?.id, "u");
});

test("no live or upcoming game means no next game", () => {
  assert.equal(pickNextGame([g("c", "FT", "01/10/2026")]), null);
  assert.equal(pickNextGame([]), null);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run check`
Expected: FAIL — `rating.test.mjs` with `Cannot find module ... utils/rating.ts`, and `game.test.mjs` with `does not provide an export named 'pickNextGame'`.

- [ ] **Step 4: Implement `utils/rating.ts`**

```ts
// Colour band for an OVR or rating number. The top band matches T.accent;
// kept as literals because this file must stay import-free for `npm run check`.
const BANDS = [
  { min: 80, color: "#2FD47A" },
  { min: 70, color: "#A3E635" },
  { min: 60, color: "#F5C518" },
] as const;

const LOWEST = "#F97316";

export function ratingColor(value: number): string {
  for (const band of BANDS) {
    if (value >= band.min) return band.color;
  }
  return LOWEST;
}
```

- [ ] **Step 5: Append to `utils/game.ts`**

```ts
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "18/10/2026" -> "18 Oct". Missing or malformed -> "TBD".
export function shortDate(date?: string): string {
  if (!date) return "TBD";
  const [day, month] = date.split("/").map(Number);
  if (!day || !month || month < 1 || month > 12) return "TBD";
  return `${day} ${MONTHS[month - 1]}`;
}

// Home's "Next match": a live game first, else the soonest upcoming one.
// Undated upcoming games rank after every dated one.
export function pickNextGame<G extends { status: string; date?: string }>(
  games: readonly G[]
): G | null {
  const live = games.find((g) => g.status === "Live");
  if (live) return live;
  let best: G | null = null;
  let bestKey = Infinity;
  for (const g of games) {
    if (g.status !== "Pending") continue;
    const key = g.date ? parseGameDate(g.date) : Infinity;
    if (best === null || key < bestKey) {
      best = g;
      bestKey = key;
    }
  }
  return best;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run check`
Expected: `ℹ pass 8`, `ℹ fail 0`. A `MODULE_TYPELESS_PACKAGE_JSON` warning is expected — do **not** add `"type": "module"` to `package.json` (it breaks Expo's CommonJS config).

- [ ] **Step 7: Replace `constants/theme.ts`**

```ts
import { Platform, type TextStyle } from "react-native";

// FotMob-style dark palette.
// See docs/superpowers/specs/2026-10-13-fotmob-redesign-design.md section 1.
export const T = {
  bg: "#000000",
  surface: "#1A1A1A",
  surfaceAlt: "#262626",
  divider: "#2B2B2B",
  text: "#F2F2F2",
  textDim: "#A3A3A3",
  textFaint: "#8A8A8A",
  accent: "#2FD47A",
  red: "#F04438",
  yellow: "#F5C518",

  // Legacy names, remapped onto the new palette so every screen re-skins at
  // once. Removed in Task 7 when no file reads them.
  border: "#2B2B2B",
  textPrimary: "#F2F2F2",
  textSecondary: "#A3A3A3",
  textMuted: "#8A8A8A",
} as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const RADIUS = { card: 16, control: 12, badge: 8, pill: 999 } as const;

export const TYPE = {
  screenTitle: { fontSize: 24, fontWeight: "700", color: T.text },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: T.text },
  rowPrimary: { fontSize: 15, fontWeight: "600", color: T.text },
  rowSecondary: { fontSize: 13, fontWeight: "400", color: T.textDim },
  caption: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  score: { fontSize: 40, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
} satisfies Record<string, TextStyle>;

// League crest colors offered during onboarding and in League settings.
export const LEAGUE_COLORS = [
  "#0039a3",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0d9488",
  "#ca8a04",
  "#e11d48",
] as const;

export const TEAM_SIZES = [5, 6, 7, 8, 11] as const;

// Expo template leftovers, still imported by hooks/use-theme-color.
const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
```

- [ ] **Step 8: Verify**

Run `VERIFY`. Expected: all four pass. If `npm run lint` reports anything in `scripts/checks/`, fix the reported line (these files are plain ESM; do not add an ESLint ignore).

- [ ] **Step 9: Visual check**

Run `SEED`, then `SHOT / t1-home` and `SHOT /games t1-games`.
Expected on screen: page background is pure black and cards are neutral grey (no navy anywhere); text is near-white. Layouts are unchanged — this task only recolours.

- [ ] **Step 10: Commit**

```bash
git add constants/theme.ts utils/rating.ts utils/game.ts scripts/checks package.json
git commit -m "feat(ui): FotMob palette, type tokens and tested rating/date helpers"
```

---

### Task 2: UI kit

**Files:**
- Create: `components/ui/IconButton.tsx`, `ScreenHeader.tsx`, `Section.tsx`, `ListRow.tsx`, `Tabs.tsx`, `RatingBadge.tsx`, `StatCompare.tsx`, `Button.tsx`, `EmptyState.tsx`
- Modify: `components/Crest.tsx` (whole file)

**Interfaces:**
- Consumes: `T`, `TYPE`, `SPACE`, `RADIUS` (Task 1); `ratingColor` (Task 1).
- Produces (all default exports):
  - `IconButton({ icon, onPress, label, tone? }: { icon: IoniconName; onPress: () => void; label: string; tone?: "plain" | "filled" })`
  - `ScreenHeader({ title?, subtitle?, leading?, action?, safeTop? }: { title?: string; subtitle?: string; leading?: ReactNode; action?: ReactNode; safeTop?: boolean })`
  - `Section({ title?, footer?, onFooterPress?, padded?, children })`
  - `ListRow({ leading?, title, badge?, subtitle?, trailing?, onPress?, divider? })` and named export `ROW_H = 64`
  - `Tabs<K extends string>({ tabs, value, onChange }: { tabs: readonly { key: K; label: string }[]; value: K; onChange: (key: K) => void })`
  - `RatingBadge({ value, color?, size? }: { value: number; color?: string; size?: "md" | "lg" })`
  - `StatCompare({ label, home, away, homeColor, awayColor }: { label: string; home: number; away: number; homeColor: string; awayColor: string })`
  - `Button({ label, onPress, variant?, icon?, disabled? }: { label: string; onPress: () => void; variant?: "primary" | "secondary" | "destructive"; icon?: IoniconName; disabled?: boolean })`
  - `EmptyState({ icon, title, sub, children? })`
  - `Crest({ name, color?, logo?, size, variant? }: { name: string; color?: string; logo?: string; size: number; variant?: "team" | "avatar" })`

- [ ] **Step 1: Create `components/ui/IconButton.tsx`**

```tsx
import type { ComponentProps } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../../constants/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export default function IconButton({
  icon,
  onPress,
  label,
  tone = "plain",
}: {
  icon: IoniconName;
  onPress: () => void;
  label: string;
  tone?: "plain" | "filled";
}) {
  const filled = tone === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        filled ? styles.filled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={filled ? "#000" : T.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  filled: { backgroundColor: T.accent },
  pressed: { opacity: 0.6 },
});
```

- [ ] **Step 2: Create `components/ui/ScreenHeader.tsx`**

```tsx
import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { T, TYPE, SPACE } from "../../constants/theme";

// Solid, left-aligned header. Inside a SafeAreaView pass safeTop={false}.
export default function ScreenHeader({
  title,
  subtitle,
  leading,
  action,
  safeTop = true,
}: {
  title?: string;
  subtitle?: string;
  leading?: ReactNode;
  action?: ReactNode;
  safeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: (safeTop ? insets.top : 0) + SPACE.sm }]}>
      {leading ?? null}
      <View style={styles.titles}>
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.md,
    backgroundColor: T.bg,
  },
  titles: { flex: 1, gap: 2 },
  title: TYPE.screenTitle,
  subtitle: TYPE.rowSecondary,
});
```

- [ ] **Step 3: Create `components/ui/Section.tsx`**

```tsx
import type { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, TYPE, SPACE, RADIUS } from "../../constants/theme";

// Borderless grey card. `padded` insets the children; leave it off for
// ListRows, which carry their own padding and dividers.
export default function Section({
  title,
  footer,
  onFooterPress,
  padded = false,
  children,
}: {
  title?: string;
  footer?: string;
  onFooterPress?: () => void;
  padded?: boolean;
  children: ReactNode;
}) {
  const bodyStyle = padded ? (title ? styles.paddedUnderTitle : styles.padded) : null;
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={bodyStyle}>{children}</View>
      {footer && onFooterPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onFooterPress}
          style={({ pressed }) => [styles.footer, pressed ? styles.pressed : null]}
        >
          <Text style={styles.footerTxt}>{footer}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: T.surface, borderRadius: RADIUS.card, overflow: "hidden" },
  title: { ...TYPE.sectionTitle, paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm },
  padded: { padding: SPACE.lg },
  paddedUnderTitle: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.xs, paddingBottom: SPACE.lg },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.divider,
    paddingVertical: SPACE.md + 2,
    alignItems: "center",
  },
  footerTxt: { fontSize: 14, fontWeight: "600", color: T.text },
  pressed: { backgroundColor: T.surfaceAlt },
});
```

- [ ] **Step 4: Create `components/ui/ListRow.tsx`**

```tsx
import type { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, TYPE, SPACE } from "../../constants/theme";

export const ROW_H = 64;

export default function ListRow({
  leading,
  title,
  badge,
  subtitle,
  trailing,
  onPress,
  divider = false,
}: {
  leading?: ReactNode;
  title: string;
  badge?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const body = (
    <>
      {leading ?? null}
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge ?? null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? null}
      {divider ? <View style={styles.divider} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  pressed: { backgroundColor: T.surfaceAlt },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  title: { ...TYPE.rowPrimary, flexShrink: 1 },
  subtitle: TYPE.rowSecondary,
  divider: {
    position: "absolute",
    left: SPACE.lg,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.divider,
  },
});
```

- [ ] **Step 5: Create `components/ui/Tabs.tsx`**

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, SPACE } from "../../constants/theme";

export default function Tabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(t.key)}
            style={styles.tab}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{t.label}</Text>
            <View style={[styles.indicator, active ? styles.indicatorActive : null]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: SPACE.xl,
    paddingHorizontal: SPACE.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.divider,
  },
  tab: { paddingTop: SPACE.sm },
  label: { fontSize: 14, fontWeight: "600", color: T.textFaint, paddingBottom: SPACE.sm + 2 },
  labelActive: { color: T.text },
  indicator: { height: 2, borderRadius: 1 },
  indicatorActive: { backgroundColor: T.accent },
});
```

- [ ] **Step 6: Create `components/ui/RatingBadge.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";
import { RADIUS } from "../../constants/theme";
import { ratingColor } from "../../utils/rating";

// Band-coloured number. Pass `color` to override the band (e.g. a #1 count).
export default function RatingBadge({
  value,
  color,
  size = "md",
}: {
  value: number;
  color?: string;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <View style={[styles.badge, lg ? styles.lg : null, { backgroundColor: color ?? ratingColor(value) }]}>
      <Text style={[styles.txt, lg ? styles.txtLg : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 36,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: RADIUS.badge,
    alignItems: "center",
    justifyContent: "center",
  },
  lg: { minWidth: 54, height: 40, borderRadius: 10 },
  txt: { fontSize: 14, fontWeight: "700", color: "#000", fontVariant: ["tabular-nums"] },
  txtLg: { fontSize: 22 },
});
```

- [ ] **Step 7: Create `components/ui/StatCompare.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";
import { T, SPACE } from "../../constants/theme";

function Value({ v, color }: { v: number; color: string | null }) {
  return (
    <View style={[styles.value, color ? { backgroundColor: color } : null]}>
      <Text style={[styles.valueTxt, color ? styles.valueTxtOn : null]}>{v}</Text>
    </View>
  );
}

// Left value · label · right value. The higher side sits in its team colour;
// a tie highlights neither.
export default function StatCompare({
  label,
  home,
  away,
  homeColor,
  awayColor,
}: {
  label: string;
  home: number;
  away: number;
  homeColor: string;
  awayColor: string;
}) {
  return (
    <View style={styles.row}>
      <Value v={home} color={home > away ? homeColor : null} />
      <Text style={styles.label}>{label}</Text>
      <Value v={away} color={away > home ? awayColor : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: SPACE.sm },
  label: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "500", color: T.textDim },
  value: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTxt: { fontSize: 15, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  valueTxtOn: { color: "#fff" },
});
```

- [ ] **Step 8: Create `components/ui/Button.tsx`**

```tsx
import type { ComponentProps } from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T, RADIUS, SPACE } from "../../constants/theme";

type Variant = "primary" | "secondary" | "destructive";
const FG: Record<Variant, string> = { primary: "#000", secondary: T.text, destructive: T.red };

export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
}) {
  const fg = FG[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" ? styles.primary : styles.neutral,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    height: 50,
    borderRadius: RADIUS.control,
  },
  primary: { backgroundColor: T.accent },
  neutral: { backgroundColor: T.surfaceAlt },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  label: { fontSize: 15, fontWeight: "700" },
});
```

- [ ] **Step 9: Create `components/ui/EmptyState.tsx`**

```tsx
import type { ComponentProps, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T, SPACE } from "../../constants/theme";

export default function EmptyState({
  icon,
  title,
  sub,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={30} color={T.textFaint} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: SPACE.xxxl, gap: 6 },
  title: { fontSize: 16, fontWeight: "600", color: T.text, marginTop: SPACE.sm },
  sub: { fontSize: 13, fontWeight: "400", color: T.textDim, textAlign: "center" },
  action: { marginTop: SPACE.md + 2, alignSelf: "stretch" },
});
```

- [ ] **Step 10: Replace `components/Crest.tsx`**

```tsx
import { View, Text, Image, StyleSheet } from "react-native";
import { teamInitials } from "../utils/game";
import { T } from "../constants/theme";

// Team crest (team colour) or player avatar (neutral grey). Shows the image
// when one exists.
export default function Crest({
  name,
  color,
  logo,
  size,
  variant = "team",
}: {
  name: string;
  color?: string;
  logo?: string;
  size: number;
  variant?: "team" | "avatar";
}) {
  const avatar = variant === "avatar";
  if (logo) {
    return (
      <Image
        source={{ uri: logo }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode={avatar ? "cover" : "contain"}
      />
    );
  }
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatar ? T.surfaceAlt : color ?? T.surfaceAlt,
        },
      ]}
    >
      <Text style={[styles.txt, { fontSize: size * 0.36, color: avatar ? T.textDim : "#fff" }]}>
        {teamInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
  txt: { fontWeight: "700" },
});
```

- [ ] **Step 11: Verify**

Run `VERIFY`. Expected: all four pass. The kit has no consumer yet, so this step proves it compiles and lints; Tasks 3–7 exercise it on screen.

- [ ] **Step 12: Commit**

```bash
git add components/ui components/Crest.tsx
git commit -m "feat(ui): shared UI kit — header, section, row, tabs, badges, button"
```

---

### Task 3: Match row and Games screen

**Files:**
- Rewrite: `components/GameCard.tsx`
- Rewrite: `app/(tabs)/games.tsx`

**Interfaces:**
- Consumes: `Crest`, `ScreenHeader`, `IconButton`, `Tabs`, `Button`, `EmptyState` (Task 2); `shortDate` (Task 1); `useGamesByStatus` (existing).
- Produces: `GameCard({ game }: { game: Game })` — a compact row with **no background**; named export `MATCH_ROW_H = 60`.

- [ ] **Step 1: Replace `components/GameCard.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";
import Crest from "./Crest";
import { T, SPACE } from "../constants/theme";
import { shortDate } from "../utils/game";
import type { Game } from "../types/games";

export const MATCH_ROW_H = 60;

// Compact match row: status | home  crest  score  crest  away.
// No background — the list it sits in provides the card.
export default function GameCard({ game }: { game: Game }) {
  const pending = game.status === "Pending";
  const live = game.status === "Live";
  const center = pending ? shortDate(game.date) : `${game.homeScore} - ${game.awayScore}`;
  const status = game.status === "FT" ? "FT" : live ? "Live" : "";
  return (
    <View style={styles.row}>
      <Text style={[styles.status, live ? styles.live : null]}>{status}</Text>
      <Text style={[styles.team, styles.home]} numberOfLines={1}>
        {game.homeTeam}
      </Text>
      <Crest name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} size={22} />
      <Text
        style={[styles.center, pending ? styles.centerDate : null, live ? styles.live : null]}
        numberOfLines={1}
      >
        {center}
      </Text>
      <Crest name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} size={22} />
      <Text style={styles.team} numberOfLines={1}>
        {game.awayTeam}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: MATCH_ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
  },
  status: { width: 30, fontSize: 12, fontWeight: "500", color: T.textFaint },
  live: { color: T.accent },
  team: { flex: 1, fontSize: 14, fontWeight: "600", color: T.text },
  home: { textAlign: "right" },
  center: {
    width: 64,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  centerDate: { fontSize: 13, fontWeight: "500", color: T.textDim },
});
```

- [ ] **Step 2: Replace `app/(tabs)/games.tsx`**

```tsx
import { useState, type ComponentProps } from "react";
import { View, Text, SectionList, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { useStore } from "../../store";
import { useGamesByStatus } from "../../store/selectors";
import GameCard from "../../components/GameCard";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Tabs from "../../components/ui/Tabs";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { Game } from "../../types/games";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "FT", label: "Results" },
  { key: "Pending", label: "Upcoming" },
  { key: "Live", label: "Live" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

type IoniconName = ComponentProps<typeof Ionicons>["name"];
const EMPTY_FILTER: Record<FilterKey, { icon: IoniconName; title: string; sub: string }> = {
  all: { icon: "football-outline", title: "No games yet", sub: "Create a game to get the season going" },
  FT: { icon: "checkmark-done-outline", title: "No results yet", sub: "Finished games will show up here" },
  Live: { icon: "radio-outline", title: "No live games", sub: "Start a game to follow it live" },
  Pending: { icon: "calendar-outline", title: "No upcoming games", sub: "Scheduled games will appear here" },
};

type GameSection = { title: string; data: Game[] };

function GameRow({
  game,
  first,
  last,
  onPress,
  onDelete,
}: {
  game: Game;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
  onDelete: (g: Game) => void;
}) {
  return (
    <View style={[styles.cell, first ? styles.cellFirst : null, last ? styles.cellLast : null]}>
      <Swipeable
        renderRightActions={() => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete game"
            style={styles.deleteAction}
            onPress={() => onDelete(game)}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </Pressable>
        )}
      >
        <Pressable
          onPress={() => onPress(game.id)}
          style={({ pressed }) => [styles.rowBg, pressed ? styles.rowPressed : null]}
        >
          <GameCard game={game} />
        </Pressable>
      </Swipeable>
      {last ? null : <View style={styles.divider} />}
    </View>
  );
}

export default function GamesScreen() {
  const router = useRouter();
  const total = useStore((s) => s.games.length);
  const deleteGame = useStore((s) => s.deleteGame);
  const { live, upcoming, results } = useGamesByStatus();
  const [filter, setFilter] = useState<FilterKey>("all");

  const openGame = (id: string) => router.push({ pathname: "/game/[id]", params: { id } });
  const confirmDelete = (g: Game) =>
    Alert.alert("Delete game?", `${g.homeTeam} vs ${g.awayTeam}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGame(g.id) },
    ]);

  const sections: GameSection[] =
    filter === "FT"
      ? [{ title: "Results", data: results }]
      : filter === "Live"
        ? [{ title: "Live", data: live }]
        : filter === "Pending"
          ? [{ title: "Upcoming", data: upcoming }]
          : [
              { title: "Live", data: live },
              { title: "Upcoming", data: upcoming },
              { title: "Results", data: results },
            ];
  const visible = sections.filter((s) => s.data.length > 0);
  const empty = EMPTY_FILTER[filter];

  return (
    <View style={styles.main}>
      <ScreenHeader
        title="Games"
        action={
          <IconButton
            icon="add"
            label="Create game"
            tone="filled"
            onPress={() => router.push("/create-game")}
          />
        }
      />
      {total === 0 ? (
        <EmptyState icon="football-outline" title="No games yet" sub="Create your first game to get the season going">
          <Button label="Create game" onPress={() => router.push("/create-game")} />
        </EmptyState>
      ) : (
        <>
          <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
          <SectionList
            sections={visible}
            keyExtractor={(g) => g.id}
            renderSectionHeader={({ section }) =>
              filter === "all" ? <Text style={styles.sectionTitle}>{section.title}</Text> : null
            }
            renderItem={({ item, index, section }) => (
              <GameRow
                game={item}
                first={index === 0}
                last={index === section.data.length - 1}
                onPress={openGame}
                onDelete={confirmDelete}
              />
            )}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState icon={empty.icon} title={empty.title} sub={empty.sub} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  list: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: SPACE.xxxl },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: T.text,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.sm,
  },
  cell: { backgroundColor: T.surface, overflow: "hidden" },
  cellFirst: { borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card },
  cellLast: { borderBottomLeftRadius: RADIUS.card, borderBottomRightRadius: RADIUS.card },
  rowBg: { backgroundColor: T.surface },
  rowPressed: { backgroundColor: T.surfaceAlt },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: T.divider, marginLeft: SPACE.lg },
  deleteAction: { backgroundColor: T.red, justifyContent: "center", alignItems: "center", width: 72 },
});
```

- [ ] **Step 3: Verify**

Run `VERIFY`. Expected: all four pass.

- [ ] **Step 4: Visual check — populated**

Run `SEED`, then `SHOT /games t3-games`.
Expected on screen:
- Left-aligned "Games" title with a green round "+" at right; no gradient, no centred title.
- Underline tabs reading All / Results / Upcoming / Live, "All" in white with a green underline.
- Section titles "Upcoming" then "Results", each above one grey rounded block of rows.
- "Hapoel Ramat Gan Givatayim" truncates with "…" on one line; "18 Oct" stays fully visible in the centre column.
- Result rows read `4 - 2` and `3 - 1` with "FT" at left. No league · location line, no watermark.

Then click the "Results" tab and `SHOT /games t3-games-results`. Expected: only the two FT rows, no section title.

- [ ] **Step 5: Visual check — empty**

Run `SEED-EMPTY`, then `SHOT /games t3-games-empty`.
Expected: "No games yet" message with a full-width green "Create game" button; no tabs.

- [ ] **Step 6: Commit**

```bash
git add components/GameCard.tsx "app/(tabs)/games.tsx"
git commit -m "feat(ui): compact match rows and FotMob-style Games screen"
```

---

### Task 4: Match header and Game detail

**Files:**
- Rewrite: `components/GameScoreboard.tsx`
- Rewrite: `app/game/[id].tsx`

**Interfaces:**
- Consumes: `Crest`, `ScreenHeader`, `IconButton`, `Section`, `ListRow`, `Button`, `EmptyState` (Task 2); `TYPE` (Task 1); `shortDate` (Task 1).
- Produces: `GameScoreboard({ game }: { game: Game })` — the old `size` prop is removed. Its only callers after this task are `app/game/[id].tsx` and (Task 5) Home.

- [ ] **Step 1: Replace `components/GameScoreboard.tsx`**

```tsx
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Crest from "./Crest";
import { T, TYPE, SPACE } from "../constants/theme";
import { shortDate } from "../utils/game";
import type { Game } from "../types/games";

const STATUS_LABEL = { FT: "Full time", Live: "Live", Pending: "Upcoming" } as const;

function Side({ name, color, logo }: { name: string; color: string; logo?: string }) {
  return (
    <View style={styles.side}>
      <Crest name={name} color={color} logo={logo} size={52} />
      <Text style={styles.team} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

// Card-less match header: crests either side, big tabular score, status under it.
export default function GameScoreboard({ game }: { game: Game }) {
  const pending = game.status === "Pending";
  const live = game.status === "Live";
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Side name={game.homeTeam} color={game.homeColor} logo={game.homeLogo} />
        <View style={styles.center}>
          <Text style={pending ? styles.date : styles.score} numberOfLines={1}>
            {pending ? shortDate(game.date) : `${game.homeScore} - ${game.awayScore}`}
          </Text>
          <Text style={[styles.status, live ? styles.live : null]}>{STATUS_LABEL[game.status]}</Text>
        </View>
        <Side name={game.awayTeam} color={game.awayColor} logo={game.awayLogo} />
      </View>
      {game.status === "FT" && game.mvp?.name ? (
        <View style={styles.mvp}>
          <Ionicons name="star" size={13} color={T.yellow} />
          <Text style={styles.mvpTxt} numberOfLines={1}>
            {game.mvp.name}
            {game.mvp.stat ? ` · ${game.mvp.stat}` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.md, paddingVertical: SPACE.lg },
  row: { flexDirection: "row", alignItems: "flex-start" },
  side: { flex: 1, alignItems: "center", gap: SPACE.sm },
  team: { fontSize: 15, fontWeight: "600", color: T.text, textAlign: "center" },
  center: { width: 120, alignItems: "center", paddingTop: 4, gap: 4 },
  score: TYPE.score,
  date: { fontSize: 24, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"], paddingTop: 8 },
  status: { fontSize: 13, fontWeight: "500", color: T.textDim },
  live: { color: T.accent },
  mvp: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  mvpTxt: { fontSize: 13, fontWeight: "400", color: T.textDim, flexShrink: 1 },
});
```

- [ ] **Step 2: Replace `app/game/[id].tsx`**

```tsx
import type { ComponentProps } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import GameScoreboard from "../../components/GameScoreboard";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import ListRow from "../../components/ui/ListRow";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { GamePlayer } from "../../types/games";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function LineupColumn({
  team,
  color,
  logo,
  players,
}: {
  team: string;
  color: string;
  logo?: string;
  players: GamePlayer[];
}) {
  return (
    <View style={styles.col}>
      <View style={styles.colHead}>
        <Crest name={team} color={color} logo={logo} size={20} />
        <Text style={styles.colTeam} numberOfLines={1}>
          {team}
        </Text>
      </View>
      {players.map((p) => (
        <View key={p.id} style={styles.colRow}>
          <Text style={styles.colName} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={styles.colPos}>{p.position}</Text>
        </View>
      ))}
    </View>
  );
}

function ScoreStepper({
  team,
  onMinus,
  onPlus,
}: {
  team: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepTeam} numberOfLines={1}>
        {team}
      </Text>
      <View style={styles.stepBtns}>
        <IconButton icon="remove" label={`Remove a goal from ${team}`} onPress={onMinus} />
        <IconButton icon="add" label={`Add a goal for ${team}`} onPress={onPlus} />
      </View>
    </View>
  );
}

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useStore((s) => s.games.find((g) => g.id === id) ?? null);
  const updateGame = useStore((s) => s.updateGame);

  const back = <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />;

  if (!game) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <ScreenHeader safeTop={false} leading={back} />
        <EmptyState icon="help-circle-outline" title="Game not found" sub="It may have been deleted." />
      </SafeAreaView>
    );
  }

  const home = game.homePlayers ?? [];
  const away = game.awayPlayers ?? [];
  const details: { icon: IoniconName; label: string }[] = [];
  if (game.date) details.push({ icon: "calendar-outline", label: game.date });
  if (game.location) details.push({ icon: "location-outline", label: game.location });
  if (game.league) details.push({ icon: "trophy-outline", label: game.league });

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <ScreenHeader
        safeTop={false}
        leading={back}
        action={
          <IconButton
            icon="create-outline"
            label="Edit game"
            onPress={() => router.push(`/create-game?id=${game.id}` as const)}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GameScoreboard game={game} />

        {game.status === "Pending" ? (
          <Button label="Start game" icon="play" onPress={() => updateGame(game.id, { status: "Live" })} />
        ) : null}

        {game.status === "Live" ? (
          <Section title="Live score" padded>
            <View style={styles.steppers}>
              <ScoreStepper
                team={game.homeTeam}
                onMinus={() => updateGame(game.id, { homeScore: Math.max(0, game.homeScore - 1) })}
                onPlus={() => updateGame(game.id, { homeScore: game.homeScore + 1 })}
              />
              <ScoreStepper
                team={game.awayTeam}
                onMinus={() => updateGame(game.id, { awayScore: Math.max(0, game.awayScore - 1) })}
                onPlus={() => updateGame(game.id, { awayScore: game.awayScore + 1 })}
              />
            </View>
            <Button
              label="Finish"
              icon="flag"
              onPress={() => router.push(`/record-result?id=${game.id}` as const)}
            />
          </Section>
        ) : null}

        {home.length > 0 || away.length > 0 ? (
          <Section title="Lineups" padded>
            <View style={styles.lineups}>
              <LineupColumn team={game.homeTeam} color={game.homeColor} logo={game.homeLogo} players={home} />
              <View style={styles.colDivider} />
              <LineupColumn team={game.awayTeam} color={game.awayColor} logo={game.awayLogo} players={away} />
            </View>
          </Section>
        ) : null}

        {details.length > 0 ? (
          <Section title="Details">
            {details.map((d, i) => (
              <ListRow
                key={d.icon}
                title={d.label}
                leading={<Ionicons name={d.icon} size={18} color={T.textDim} />}
                divider={i < details.length - 1}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  lineups: { flexDirection: "row", gap: SPACE.md },
  col: { flex: 1, gap: 10 },
  colHead: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: 2 },
  colTeam: { fontSize: 14, fontWeight: "600", color: T.text, flexShrink: 1 },
  colRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  colName: { flex: 1, fontSize: 14, fontWeight: "400", color: T.text },
  colPos: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  colDivider: { width: StyleSheet.hairlineWidth, backgroundColor: T.divider },
  steppers: { flexDirection: "row", gap: SPACE.md, marginBottom: SPACE.md },
  stepper: {
    flex: 1,
    alignItems: "center",
    gap: SPACE.sm,
    backgroundColor: T.surfaceAlt,
    borderRadius: RADIUS.control,
    padding: SPACE.md,
  },
  stepTeam: { fontSize: 14, fontWeight: "600", color: T.text },
  stepBtns: { flexDirection: "row", gap: SPACE.sm },
});
```

- [ ] **Step 3: Verify**

Run `VERIFY`. Expected: all four pass. `tsc` proves no caller still passes the removed `size` prop.

- [ ] **Step 4: Visual check**

Run `SEED`, then `SHOT /game/g1 t4-game-ft` and `SHOT /game/g3 t4-game-pending`.
Expected on `t4-game-ft`: back chevron left, edit icon right, no title; Lions and Wolves crests with names; `4 - 2` large and white with "Full time" under it in grey; a yellow star line "Daniel Cohen · 2 goals, 1 assist"; a **Lineups** card with two columns split by a hairline, each name with a grey position; a **Details** card with the date, location and league once each. No bordered boxes, no "MVP" eyebrow.
Expected on `t4-game-pending`: "18 Oct" in the centre with "Upcoming" under it, the long home name wrapping to at most two lines under its crest, and a green full-width "Start game" button.

- [ ] **Step 5: Commit**

```bash
git add components/GameScoreboard.tsx "app/game/[id].tsx"
git commit -m "feat(ui): card-less match header and restyled game detail"
```

---

### Task 5: Home

**Files:**
- Modify: `utils/game.ts` (append `computeRivalry`)
- Modify: `scripts/checks/game.test.mjs` (append tests)
- Modify: `store/selectors.ts` (`useNextGame`; `useRivalry`)
- Rewrite: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `pickNextGame` (Task 1); `GameScoreboard` (Task 4); `ScreenHeader`, `IconButton`, `Section`, `ListRow`, `Tabs`, `RatingBadge`, `StatCompare`, `Button`, `Crest` (Task 2); `useLastGame` (existing).
- Produces: `computeRivalry<G extends RivalryGame>(games: readonly G[]): Rivalry<G> | null` where `Rivalry<G> = { teamA: string; teamB: string; count: number; winsA: number; winsB: number; draws: number; lastGame: G }`; `useNextGame(): Game | null`; `useRivalry(): Rivalry<Game> | null` (shape changed — it had no consumers before this task).

- [ ] **Step 1: Write the failing tests**

Append to `scripts/checks/game.test.mjs` (also add `computeRivalry` to its import line, making it `import { computeRivalry, pickNextGame, shortDate } from "../../utils/game.ts";`):

```js
const m = (id, date, homeTeam, awayTeam, homeScore, awayScore, status = "FT") => ({
  id, date, status, homeTeam, awayTeam, homeScore, awayScore,
});

test("rivalry credits wins to the team that won, not the home slot", () => {
  const r = computeRivalry([
    m("a", "04/10/2026", "Lions", "Wolves", 4, 2), // Lions win at home
    m("b", "11/10/2026", "Wolves", "Lions", 3, 1), // Wolves win at home
    m("c", "18/10/2026", "Lions", "Wolves", 2, 2), // draw
  ]);
  assert.equal(r.teamA, "Lions");
  assert.equal(r.teamB, "Wolves");
  assert.equal(r.count, 3);
  assert.equal(r.winsA, 1);
  assert.equal(r.winsB, 1);
  assert.equal(r.draws, 1);
  assert.equal(r.lastGame.id, "c");
});

test("rivalry needs two finished meetings", () => {
  assert.equal(computeRivalry([m("a", "04/10/2026", "Lions", "Wolves", 1, 0)]), null);
  assert.equal(
    computeRivalry([
      m("a", "04/10/2026", "Lions", "Wolves", 1, 0),
      m("b", "13/10/2026", "Lions", "Wolves", 0, 0, "Pending"),
    ]),
    null
  );
});

test("rivalry matches team names case- and space-insensitively", () => {
  const r = computeRivalry([
    m("a", "04/10/2026", "Lions", "Wolves", 1, 0),
    m("b", "13/10/2026", " wolves ", "LIONS", 2, 0),
  ]);
  assert.equal(r.count, 2);
  assert.equal(r.winsA + r.winsB, 2);
  assert.equal(r.winsA, 1);
});

test("rivalry picks the most-played pairing", () => {
  const r = computeRivalry([
    m("a", "01/10/2026", "Lions", "Wolves", 1, 0),
    m("b", "02/10/2026", "Lions", "Wolves", 1, 0),
    m("c", "03/10/2026", "Bears", "Hawks", 1, 0),
    m("d", "04/10/2026", "Bears", "Hawks", 1, 0),
    m("e", "05/10/2026", "Bears", "Hawks", 1, 0),
  ]);
  assert.equal(r.teamA, "Bears");
  assert.equal(r.count, 3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run check`
Expected: FAIL — `does not provide an export named 'computeRivalry'`.

- [ ] **Step 3: Append `computeRivalry` to `utils/game.ts`**

```ts
type RivalryGame = {
  status: string;
  date?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
};

export type Rivalry<G> = {
  teamA: string;
  teamB: string;
  count: number;
  winsA: number;
  winsB: number;
  draws: number;
  lastGame: G;
};

const teamKey = (team: string) => team.toLowerCase().trim();

// The most-played pairing among finished games, with wins credited to the
// team that won (home/away flips between fixtures). Needs 2+ meetings.
export function computeRivalry<G extends RivalryGame>(games: readonly G[]): Rivalry<G> | null {
  const pairs = new Map<string, Rivalry<G>>();
  for (const g of games) {
    if (g.status !== "FT") continue;
    const [a, b] = [g.homeTeam, g.awayTeam].sort((x, y) => teamKey(x).localeCompare(teamKey(y)));
    const key = `${teamKey(a)}||${teamKey(b)}`;
    let r = pairs.get(key);
    if (!r) {
      r = { teamA: a.trim(), teamB: b.trim(), count: 0, winsA: 0, winsB: 0, draws: 0, lastGame: g };
      pairs.set(key, r);
    }
    r.count++;
    if (g.homeScore === g.awayScore) {
      r.draws++;
    } else {
      const winner = g.homeScore > g.awayScore ? g.homeTeam : g.awayTeam;
      if (teamKey(winner) === teamKey(r.teamA)) r.winsA++;
      else r.winsB++;
    }
    if (parseGameDate(g.date) > parseGameDate(r.lastGame.date)) r.lastGame = g;
  }
  let best: Rivalry<G> | null = null;
  for (const r of pairs.values()) {
    if (r.count >= 2 && (best === null || r.count > best.count)) best = r;
  }
  return best;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run check`
Expected: `ℹ pass 12`, `ℹ fail 0`.

- [ ] **Step 5: Update `store/selectors.ts`**

Change the `../utils/game` import line to:

```ts
import { computeRivalry, parseGameDate, pickNextGame } from "../utils/game";
```

Delete the `normalizeTeamKey` helper and replace the whole `useRivalry` export with:

```ts
// Most-played pairing with wins credited per team. computeRivalry builds a
// fresh object, so select the stable games slice and memoize the derivation.
export const useRivalry = () => {
  const games = useStore((s) => s.games);
  return useMemo(() => computeRivalry(games), [games]);
};

// Home's "Next match". pickNextGame returns an existing game object (or null),
// so the selector result is referentially stable.
export const useNextGame = () => useStore((s) => pickNextGame(s.games));
```

`useShallow` stays imported — `useAppStats` still uses it.

- [ ] **Step 6: Replace `app/(tabs)/index.tsx`**

```tsx
import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useStore } from "../../store";
import { useLastGame, useNextGame, useRivalry } from "../../store/selectors";
import GameScoreboard from "../../components/GameScoreboard";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import ListRow from "../../components/ui/ListRow";
import Tabs from "../../components/ui/Tabs";
import RatingBadge from "../../components/ui/RatingBadge";
import StatCompare from "../../components/ui/StatCompare";
import Button from "../../components/ui/Button";
import { T, SPACE } from "../../constants/theme";
import { formatDate, parseGameDate } from "../../utils/game";
import type { Game } from "../../types/games";
import type { Player } from "../../types/players";

const DAY_LETTERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEADER_TABS = [
  { key: "mvps", label: "MVPs" },
  { key: "rating", label: "Rating" },
  { key: "streak", label: "Streak" },
] as const;
type LeaderKey = (typeof LEADER_TABS)[number]["key"];

function winStreak(playerId: string, finishedGames: Game[]) {
  let streak = 0;
  for (const g of finishedGames) {
    const inHome = (g.homePlayers ?? []).some((p) => p.id === playerId);
    const inAway = (g.awayPlayers ?? []).some((p) => p.id === playerId);
    if (!inHome && !inAway) continue;
    const won = inHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
    if (!won) break;
    streak++;
  }
  return streak;
}

function DayStrip({ gameDates }: { gameDates: Set<string> }) {
  const today = new Date();
  const todayStr = formatDate(today);
  return (
    <View style={styles.days}>
      {Array.from({ length: 7 }, (_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() + i - 1);
        const key = formatDate(day);
        const isToday = key === todayStr;
        return (
          <View key={key} style={[styles.day, isToday ? styles.dayToday : null]}>
            <Text style={[styles.dayLetter, isToday ? styles.dayTextToday : null]}>
              {DAY_LETTERS[day.getDay()]}
            </Text>
            <Text style={[styles.dayNum, isToday ? styles.dayTextToday : null]}>{day.getDate()}</Text>
            <View style={[styles.dot, gameDates.has(key) ? styles.dotOn : null]} />
          </View>
        );
      })}
    </View>
  );
}

function MatchSection({ title, game }: { title: string; game: Game }) {
  const router = useRouter();
  return (
    <Section title={title}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
        style={({ pressed }) => [styles.match, pressed ? styles.pressed : null]}
      >
        <GameScoreboard game={game} />
      </Pressable>
    </Section>
  );
}

function HeadToHead() {
  const rivalry = useRivalry();
  if (!rivalry) return null;
  const { teamA, teamB, winsA, winsB, draws, count, lastGame } = rivalry;
  const look = (team: string) =>
    lastGame.homeTeam.toLowerCase().trim() === team.toLowerCase().trim()
      ? { color: lastGame.homeColor, logo: lastGame.homeLogo }
      : { color: lastGame.awayColor, logo: lastGame.awayLogo };
  const a = look(teamA);
  const b = look(teamB);
  return (
    <Section title="Head to head" padded>
      <View style={styles.h2hTeams}>
        <View style={styles.h2hTeam}>
          <Crest name={teamA} color={a.color} logo={a.logo} size={28} />
          <Text style={styles.h2hName} numberOfLines={1}>
            {teamA}
          </Text>
        </View>
        <Text style={styles.h2hMeta}>{count} games</Text>
        <View style={[styles.h2hTeam, styles.h2hTeamRight]}>
          <Text style={styles.h2hName} numberOfLines={1}>
            {teamB}
          </Text>
          <Crest name={teamB} color={b.color} logo={b.logo} size={28} />
        </View>
      </View>
      <StatCompare label="Wins" home={winsA} away={winsB} homeColor={a.color} awayColor={b.color} />
      <Text style={styles.h2hDraws}>
        {draws} {draws === 1 ? "draw" : "draws"}
      </Text>
    </Section>
  );
}

function Leaders({ players, games }: { players: Player[]; games: Game[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<LeaderKey>(() =>
    players.some((p) => p.mvps > 0) ? "mvps" : "rating"
  );
  const finished = games
    .filter((g) => g.status === "FT")
    .sort((a, b) => parseGameDate(b.date) - parseGameDate(a.date));
  const statOf = (p: Player) =>
    mode === "mvps" ? p.mvps : mode === "rating" ? p.ovr : winStreak(p.id, finished);
  const top = [...players].sort((a, b) => statOf(b) - statOf(a) || b.ovr - a.ovr).slice(0, 5);

  return (
    <Section title="Leaders" footer="All players" onFooterPress={() => router.push("/players")}>
      <Tabs tabs={LEADER_TABS} value={mode} onChange={setMode} />
      {top.map((p, i) => (
        <ListRow
          key={p.id}
          onPress={() => router.push({ pathname: "/player/[id]", params: { id: p.id } })}
          leading={
            <View style={styles.rankWrap}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Crest name={p.name} logo={p.photo} size={32} variant="avatar" />
            </View>
          }
          title={p.name}
          subtitle={p.position}
          trailing={
            mode === "rating" ? (
              <RatingBadge value={p.ovr} />
            ) : i === 0 ? (
              <RatingBadge value={statOf(p)} color={T.accent} />
            ) : (
              <Text style={styles.stat}>{statOf(p)}</Text>
            )
          }
          divider={i < top.length - 1}
        />
      ))}
    </Section>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const league = useStore((s) => s.league);
  const games = useStore((s) => s.games);
  const players = useStore((s) => s.players);
  const nextGame = useNextGame();
  const lastResult = useLastGame();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  if (!hasOnboarded) return <Redirect href="/onboarding" />;

  const gameDates = new Set(games.map((g) => g.date).filter((d): d is string => !!d));
  const played = games.filter((g) => g.status === "FT").length;
  const hasPlayers = players.length > 0;

  return (
    <View style={styles.main}>
      <ScreenHeader
        leading={
          <Crest
            name={league.name || "League"}
            color={league.color}
            logo={league.logoUri ?? undefined}
            size={36}
          />
        }
        title={league.name || "My League"}
        subtitle={`${played} played · ${players.length} players`}
        action={
          <IconButton icon="settings-outline" label="League settings" onPress={() => router.push("/league")} />
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} colors={[T.accent]} />
        }
      >
        <DayStrip gameDates={gameDates} />

        {nextGame ? (
          <MatchSection title={nextGame.status === "Live" ? "Live now" : "Next match"} game={nextGame} />
        ) : null}
        {lastResult ? <MatchSection title="Last result" game={lastResult} /> : null}

        {!nextGame && !lastResult ? (
          <Section title="No games yet" padded>
            <View style={styles.prompt}>
              <Text style={styles.body}>
                {hasPlayers
                  ? "Set up your first match to get the season going."
                  : "Add your players first, then set up a match."}
              </Text>
              <Button
                label={hasPlayers ? "Create game" : "Add player"}
                onPress={() => router.push(hasPlayers ? "/create-game" : "/create-player")}
              />
            </View>
          </Section>
        ) : null}

        <HeadToHead />
        {hasPlayers ? <Leaders players={players} games={games} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  days: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", width: 44, paddingVertical: SPACE.sm, borderRadius: 12, gap: 2 },
  dayToday: { backgroundColor: T.surface },
  dayLetter: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  dayNum: { fontSize: 15, fontWeight: "600", color: T.textDim, fontVariant: ["tabular-nums"] },
  dayTextToday: { color: T.text },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  dotOn: { backgroundColor: T.accent },
  match: { paddingHorizontal: SPACE.lg },
  pressed: { backgroundColor: T.surfaceAlt },
  prompt: { gap: SPACE.md },
  body: { fontSize: 14, fontWeight: "400", color: T.textDim, lineHeight: 20 },
  h2hTeams: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm },
  h2hTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  h2hTeamRight: { justifyContent: "flex-end" },
  h2hName: { fontSize: 15, fontWeight: "600", color: T.text, flexShrink: 1 },
  h2hMeta: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  h2hDraws: { fontSize: 12, fontWeight: "500", color: T.textFaint, textAlign: "center" },
  rankWrap: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  rank: {
    width: 14,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: T.textFaint,
    fontVariant: ["tabular-nums"],
  },
  stat: {
    minWidth: 36,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
});
```

- [ ] **Step 7: Verify**

Run `VERIFY`. Expected: all four pass.

- [ ] **Step 8: Visual check — populated**

Run `SEED`, then `SHOT / t5-home`.
Expected on screen:
- Header: green "SL" crest, "Sunday League", subtitle "2 played · 8 players", settings gear at right. No greeting, no trash icon, no gradient.
- A single row of 7 day pills, today on a grey pill; a green dot only under days that have a game in the seed.
- **Next match** shows the 18 Oct Hapoel vs Lions fixture with "Upcoming". **Last result** shows Wolves `3 - 1` Lions with "Full time" — *not* the 18 Oct fixture. (This is the Home bug fix.)
- **Head to head**: Lions and Wolves with "2 games", and Wins `1` vs `1` with **neither** side highlighted (tie), then "0 draws".
- **Leaders** with MVPs / Rating / Streak tabs; Daniel Cohen #1 with a green `4` badge; "Itay Ben David-Abergel" (if listed) truncates on one line; an "All players" footer.

- [ ] **Step 9: Visual check — empty**

Run `SEED-EMPTY`, then `SHOT / t5-home-empty`.
Expected: header plus day strip, then a **No games yet** card reading "Add your players first, then set up a match." with a green "Add player" button. No Head to head, no Leaders, no blank areas.

- [ ] **Step 10: Commit**

```bash
git add utils/game.ts scripts/checks/game.test.mjs store/selectors.ts "app/(tabs)/index.tsx"
git commit -m "feat(ui): FotMob-style Home; split next match from last result

Home's featured slot showed the latest-dated game of any status, so an
upcoming fixture appeared as the last result. It now shows Next match
(live, else soonest dated fixture) and Last result (latest FT) separately.
useRivalry now credits wins per team instead of per home slot."
```

---

### Task 6: Players and player detail

**Files:**
- Rewrite: `app/(tabs)/players.tsx`
- Rewrite: `app/player/[id].tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `IconButton`, `Tabs`, `ListRow` + `ROW_H`, `RatingBadge`, `Section`, `Button`, `EmptyState`, `Crest` (Task 2); `ratingColor` (Task 1); `usePlayersByPosition` (existing).
- Produces: nothing new for later tasks.

- [ ] **Step 1: Replace `app/(tabs)/players.tsx`**

```tsx
import { memo, useState, type ComponentProps } from "react";
import { View, Text, FlatList, StyleSheet, type ListRenderItemInfo } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePlayersByPosition } from "../../store/selectors";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Tabs from "../../components/ui/Tabs";
import ListRow, { ROW_H } from "../../components/ui/ListRow";
import RatingBadge from "../../components/ui/RatingBadge";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE, RADIUS } from "../../constants/theme";
import type { Player } from "../../types/players";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "GK", label: "GK" },
  { key: "DEF", label: "DEF" },
  { key: "MID", label: "MID" },
  { key: "FWD", label: "FWD" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const EMPTY: Record<FilterKey, { title: string; sub: string }> = {
  all: { title: "No players yet", sub: "Add your first player to build the squad" },
  GK: { title: "No keepers", sub: "Nobody is listed as GK yet" },
  DEF: { title: "No defenders", sub: "Nobody is listed as DEF yet" },
  MID: { title: "No midfielders", sub: "Nobody is listed as MID yet" },
  FWD: { title: "No forwards", sub: "Nobody is listed as FWD yet" },
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];
const FORM_ARROW: Record<Player["form"], { icon: IoniconName; color: string } | null> = {
  hot: { icon: "arrow-up", color: T.accent },
  cold: { icon: "arrow-down", color: T.red },
  neutral: null,
};

// Only primitives cross this boundary, so the shallow compare in memo works.
const PlayerRow = memo(function PlayerRow({
  id,
  name,
  position,
  ovr,
  form,
  isMvp,
  photo,
  first,
  last,
  onPress,
}: {
  id: string;
  name: string;
  position: string;
  ovr: number;
  form: Player["form"];
  isMvp: boolean;
  photo?: string;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
}) {
  const arrow = FORM_ARROW[form] ?? null;
  return (
    <View style={[styles.cell, first ? styles.cellFirst : null, last ? styles.cellLast : null]}>
      <ListRow
        onPress={() => onPress(id)}
        leading={<Crest name={name} logo={photo} size={40} variant="avatar" />}
        title={name}
        badge={
          isMvp ? (
            <View style={styles.mvp}>
              <Text style={styles.mvpTxt}>MVP</Text>
            </View>
          ) : undefined
        }
        subtitle={position}
        trailing={
          <View style={styles.trailing}>
            {arrow ? <Ionicons name={arrow.icon} size={14} color={arrow.color} /> : null}
            <RatingBadge value={ovr} />
          </View>
        }
        divider={!last}
      />
    </View>
  );
});

const keyExtractor = (p: Player) => p.id;
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_H,
  offset: ROW_H * index,
  index,
});

export default function PlayersScreen() {
  const router = useRouter();
  const roster = usePlayersByPosition();
  const [filter, setFilter] = useState<FilterKey>("all");

  // One stable callback for the whole list; rows call it with their own id.
  const openPlayer = (id: string) => router.push({ pathname: "/player/[id]", params: { id } });

  const players = roster[filter];
  const empty = EMPTY[filter];

  const renderItem = ({ item, index }: ListRenderItemInfo<Player>) => (
    <PlayerRow
      id={item.id}
      name={item.name}
      position={item.position}
      ovr={item.ovr}
      form={item.form}
      isMvp={!!item.isMvp}
      photo={item.photo}
      first={index === 0}
      last={index === players.length - 1}
      onPress={openPlayer}
    />
  );

  return (
    <View style={styles.main}>
      <ScreenHeader
        title="Players"
        subtitle={`${roster.all.length} in the squad`}
        action={
          <IconButton icon="add" label="Add player" tone="filled" onPress={() => router.push("/create-player")} />
        }
      />
      <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="people-outline" title={empty.title} sub={empty.sub} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  list: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xxxl },
  cell: { backgroundColor: T.surface, overflow: "hidden" },
  cellFirst: { borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card },
  cellLast: { borderBottomLeftRadius: RADIUS.card, borderBottomRightRadius: RADIUS.card },
  mvp: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: T.yellow },
  mvpTxt: { fontSize: 10, fontWeight: "700", color: "#000" },
  trailing: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
});
```

- [ ] **Step 2: Replace `app/player/[id].tsx`**

```tsx
import { View, Text, ScrollView, StyleSheet, Alert, type DimensionValue } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import IconButton from "../../components/ui/IconButton";
import Section from "../../components/ui/Section";
import RatingBadge from "../../components/ui/RatingBadge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { T, SPACE } from "../../constants/theme";
import { ratingColor } from "../../utils/rating";
import type { Player } from "../../types/players";

const ATTR_ROWS = [
  ["pac", "Pace"],
  ["sho", "Shooting"],
  ["pas", "Passing"],
  ["dri", "Dribbling"],
  ["def", "Defending"],
  ["phy", "Physical"],
] as const;

const STATS = [
  ["goals", "Goals"],
  ["assists", "Assists"],
  ["mvps", "MVPs"],
] as const;

const FORM_LABEL: Record<Player["form"], string> = {
  hot: "In form",
  cold: "Off form",
  neutral: "Steady form",
};

const FOOT_LABEL: Record<Player["foot"], string> = { L: "Left foot", R: "Right foot" };

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useStore((s) => s.players.find((p) => p.id === id) ?? null);
  const setMvp = useStore((s) => s.setMvp);
  const deletePlayer = useStore((s) => s.deletePlayer);

  const back = <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />;

  if (!player) {
    return (
      <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
        <ScreenHeader safeTop={false} leading={back} />
        <EmptyState icon="help-circle-outline" title="Player not found" sub="They may have been deleted." />
      </SafeAreaView>
    );
  }

  const confirmDelete = () =>
    Alert.alert("Delete player?", player.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlayer(player.id);
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.main} edges={["top", "bottom"]}>
      <ScreenHeader
        safeTop={false}
        leading={back}
        action={
          <IconButton
            icon="create-outline"
            label="Edit player"
            onPress={() => router.push({ pathname: "/create-player", params: { id: player.id } })}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Crest name={player.name} logo={player.photo} size={72} variant="avatar" />
          <View style={styles.identityMain}>
            <Text style={styles.name} numberOfLines={2}>
              {player.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {player.position} · {FOOT_LABEL[player.foot]} · {FORM_LABEL[player.form] ?? FORM_LABEL.neutral}
            </Text>
            {player.isMvp ? (
              <View style={styles.mvp}>
                <Ionicons name="star" size={12} color="#000" />
                <Text style={styles.mvpTxt}>League MVP</Text>
              </View>
            ) : null}
          </View>
          <RatingBadge value={player.ovr} size="lg" />
        </View>

        <Section title="Season" padded>
          <View style={styles.stats}>
            {STATS.map(([key, label]) => (
              <View key={key} style={styles.stat}>
                <Text style={styles.statValue}>{player[key]}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Attributes" padded>
          <View style={styles.attrs}>
            {ATTR_ROWS.map(([key, label]) => {
              const value = player[key];
              const width = `${value}%` as DimensionValue;
              return (
                <View key={key} style={styles.attr}>
                  <Text style={styles.attrLabel}>{label}</Text>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width, backgroundColor: ratingColor(value) }]} />
                  </View>
                  <Text style={styles.attrValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        </Section>

        <View style={styles.actions}>
          <Button
            variant="secondary"
            icon="trophy-outline"
            label={player.isMvp ? "Current league MVP" : "Set as league MVP"}
            disabled={!!player.isMvp}
            onPress={() => setMvp(player.id)}
          />
          <Button variant="destructive" icon="trash-outline" label="Delete player" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  identity: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: SPACE.sm },
  identityMain: { flex: 1, gap: 6 },
  name: { fontSize: 22, fontWeight: "700", color: T.text },
  meta: { fontSize: 13, fontWeight: "400", color: T.textDim },
  mvp: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: T.yellow,
  },
  mvpTxt: { fontSize: 11, fontWeight: "700", color: "#000" },
  stats: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "700", color: T.text, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  attrs: { gap: 12 },
  attr: { flexDirection: "row", alignItems: "center", gap: 10 },
  attrLabel: { width: 82, fontSize: 13, fontWeight: "500", color: T.textDim },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: T.surfaceAlt, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  attrValue: {
    width: 26,
    textAlign: "right",
    fontSize: 15,
    fontWeight: "600",
    color: T.text,
    fontVariant: ["tabular-nums"],
  },
  actions: { gap: SPACE.sm },
});
```

- [ ] **Step 3: Verify**

Run `VERIFY`. Expected: all four pass.

- [ ] **Step 4: Visual check — populated**

Run `SEED`, then `SHOT /players t6-players` and `SHOT /player/p1 t6-player`.
Expected on `t6-players`: "Players" / "8 in the squad" with a green "+"; underline position tabs; one grey rounded block of rows with hairline dividers; **grey** initials avatars (not eight green circles); OVR as colour-banded badges (Daniel Cohen `72` lime, Amit Shapira `53` orange); green up-arrows for hot form, red down-arrows for cold; a yellow "MVP" tag on Daniel Cohen; "Itay Ben David-Abergel" truncated on one line with its badge still visible.
Expected on `t6-player`: grey avatar, "Daniel Cohen", "FWD · Right foot · In form", a yellow "League MVP" tag, a large lime `72`; Season stats 14 / 5 / 4; six attribute bars coloured by band; a disabled "Current league MVP" button and a red-text "Delete player" button.

- [ ] **Step 5: Visual check — empty filter**

With `SEED` still loaded, open `/players`, click the "GK" tab — one row (Amit Shapira). Then run `SEED-EMPTY` and `SHOT /players t6-players-empty`. Expected: "No players yet" message under the tabs, no blank screen.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/players.tsx" "app/player/[id].tsx"
git commit -m "feat(ui): FotMob-style roster and player detail"
```

---

### Task 7: League, tab bar, forms, and retiring legacy tokens

**Files:**
- Rewrite: `app/(tabs)/league.tsx`
- Modify: `app/(tabs)/_layout.tsx` (icon colours and bar/pill styles)
- Modify: `app/create-player.tsx`, `app/create-game.tsx`, `app/record-result.tsx`, `app/onboarding.tsx`, `components/wizard/TeamStep.tsx`, `components/wizard/DetailsStep.tsx`
- Modify: every file still reading `T.border`, `T.textPrimary`, `T.textSecondary`, `T.textMuted`; then `constants/theme.ts`

**Interfaces:**
- Consumes: `ScreenHeader`, `Section`, `Button`, `Crest` (Task 2); `T`, `SPACE`, `RADIUS` (Task 1).
- Produces: `T` without the legacy keys — after this task only `bg surface surfaceAlt divider text textDim textFaint accent red yellow` exist.

- [ ] **Step 1: Replace `app/(tabs)/league.tsx`**

```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type AlertButton,
  type TextInputProps,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useStore } from "../../store";
import Crest from "../../components/Crest";
import ScreenHeader from "../../components/ui/ScreenHeader";
import Section from "../../components/ui/Section";
import Button from "../../components/ui/Button";
import { T, SPACE, RADIUS, LEAGUE_COLORS, TEAM_SIZES } from "../../constants/theme";

function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={T.textFaint} {...input} />
    </View>
  );
}

export default function LeagueScreen() {
  const router = useRouter();
  const league = useStore((s) => s.league);
  const setLeague = useStore((s) => s.setLeague);
  const resetAll = useStore((s) => s.resetAll);

  const [name, setName] = useState(league.name);
  const [logoUri, setLogoUri] = useState<string | null>(league.logoUri);
  const [color, setColor] = useState<string>(league.color);
  const [location, setLocation] = useState(league.defaultLocation);
  const [teamSize, setTeamSize] = useState<number>(league.defaultTeamSize);
  const [adminName, setAdminName] = useState(league.adminName);

  const dirty =
    name !== league.name ||
    logoUri !== league.logoUri ||
    color !== league.color ||
    location !== league.defaultLocation ||
    teamSize !== league.defaultTeamSize ||
    adminName !== league.adminName;
  const canSave = dirty && name.trim().length > 0;

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setLogoUri(res.assets[0].uri);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera unavailable", "Allow camera access to take a photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) setLogoUri(res.assets[0].uri);
  }

  function pickLogo() {
    const buttons: AlertButton[] = [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
    ];
    if (logoUri) buttons.push({ text: "Remove", style: "destructive", onPress: () => setLogoUri(null) });
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert("League logo", "Choose a source", buttons);
  }

  function save() {
    if (!canSave) return;
    setLeague({
      name: name.trim(),
      logoUri,
      color,
      defaultLocation: location.trim(),
      defaultTeamSize: teamSize,
      adminName: adminName.trim(),
    });
  }

  function confirmReset() {
    Alert.alert(
      "Reset all data?",
      "This deletes every player, game and league setting on this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset everything",
          style: "destructive",
          onPress: () => {
            resetAll();
            router.replace("/onboarding");
          },
        },
      ]
    );
  }

  return (
    <View style={styles.main}>
      <ScreenHeader title="League" subtitle="Settings on this device" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section>
            <Pressable
              accessibilityRole="button"
              onPress={pickLogo}
              style={({ pressed }) => [styles.crestRow, pressed ? styles.pressed : null]}
            >
              <Crest name={name || "League"} color={color} logo={logoUri ?? undefined} size={56} />
              <View style={styles.crestCopy}>
                <Text style={styles.crestTitle}>League crest</Text>
                <Text style={styles.crestSub}>Tap to change</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={T.textFaint} />
            </Pressable>
          </Section>

          <Section title="Details" padded>
            <View style={styles.fields}>
              <Field label="League name" value={name} onChangeText={setName} placeholder="Sunday League" />
              <Field label="Admin name" value={adminName} onChangeText={setAdminName} placeholder="Who runs the league" />
              <Field
                label="Default location"
                value={location}
                onChangeText={setLocation}
                placeholder="The usual pitch"
              />
            </View>
          </Section>

          <Section title="League color" padded>
            <View style={styles.swatches}>
              {LEAGUE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`Color ${c}`}
                  accessibilityState={{ selected: color === c }}
                  style={[styles.swatch, { backgroundColor: c }, color === c ? styles.swatchActive : null]}
                  onPress={() => setColor(c)}
                >
                  {color === c ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </Pressable>
              ))}
            </View>
          </Section>

          <Section title="Default team size" padded>
            <View style={styles.sizes}>
              {TEAM_SIZES.map((s) => (
                <Pressable
                  key={s}
                  accessibilityRole="button"
                  accessibilityState={{ selected: teamSize === s }}
                  style={[styles.size, teamSize === s ? styles.sizeActive : null]}
                  onPress={() => setTeamSize(s)}
                >
                  <Text style={[styles.sizeTxt, teamSize === s ? styles.sizeTxtActive : null]}>
                    {s}v{s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Button label={dirty ? "Save changes" : "Saved"} disabled={!canSave} onPress={save} />

          <Section title="Danger zone" padded>
            <View style={styles.danger}>
              <Text style={styles.dangerSub}>
                Deletes every player, game and setting on this device, then restarts onboarding.
              </Text>
              <Button variant="destructive" icon="trash-outline" label="Reset all data" onPress={confirmReset} />
            </View>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.xxxl, gap: SPACE.lg },
  pressed: { backgroundColor: T.surfaceAlt },
  crestRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: SPACE.lg },
  crestCopy: { flex: 1, gap: 2 },
  crestTitle: { fontSize: 15, fontWeight: "600", color: T.text },
  crestSub: { fontSize: 13, fontWeight: "400", color: T.textDim },
  fields: { gap: SPACE.md },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "500", color: T.textFaint },
  input: {
    backgroundColor: T.surfaceAlt,
    borderRadius: RADIUS.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
    color: T.text,
  },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: T.text },
  sizes: { flexDirection: "row", gap: SPACE.sm },
  size: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: RADIUS.control,
    backgroundColor: T.surfaceAlt,
  },
  sizeActive: { backgroundColor: T.accent },
  sizeTxt: { fontSize: 13, fontWeight: "600", color: T.textDim, fontVariant: ["tabular-nums"] },
  sizeTxtActive: { color: "#000" },
  danger: { gap: SPACE.md },
  dangerSub: { fontSize: 13, fontWeight: "400", color: T.textDim, lineHeight: 18 },
});
```

- [ ] **Step 2: Restyle the tab bar in `app/(tabs)/_layout.tsx`**

Replace the icon colour line:

```tsx
              color={focused ? T.textPrimary : T.textMuted}
```

with:

```tsx
              color={focused ? T.accent : T.textFaint}
```

Replace the `bar` and `pill` entries in `StyleSheet.create` with:

```tsx
  bar: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.divider,
  },
```

```tsx
  pill: {
    position: 'absolute',
    left: 0,
    top: 12,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 999,
    backgroundColor: T.surfaceAlt,
  },
```

- [ ] **Step 3: Form sweep — weights**

```bash
FILES="app/create-player.tsx app/create-game.tsx app/record-result.tsx app/onboarding.tsx components/wizard/TeamStep.tsx components/wizard/DetailsStep.tsx"
sed -i -E 's/fontWeight: "(800|900)"/fontWeight: "700"/g' $FILES
grep -cE 'fontWeight: "(800|900)"' $FILES
```

Expected: every count prints `0`.

- [ ] **Step 4: Form sweep — accent CTAs and yellow MVP chips**

Apply these exact replacements (each `old` occurs exactly once unless stated):

| File | Old | New |
|---|---|---|
| `app/create-player.tsx` | `backgroundColor: T.textPrimary,` (**all 3**: slider fill, slider thumb, save button) | `backgroundColor: T.accent,` |
| `app/create-game.tsx` | `progressSegActive: { backgroundColor: T.textPrimary }` | `progressSegActive: { backgroundColor: T.accent }` |
| `app/create-game.tsx` | `nextBtn: { flex: 1, backgroundColor: T.textPrimary,` | `nextBtn: { flex: 1, backgroundColor: T.accent,` |
| `app/record-result.tsx` | `chipOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },` | `chipOn: { backgroundColor: T.yellow, borderColor: T.yellow },` |
| `app/record-result.tsx` | `chipTxtOn: { color: "#fff" },` | `chipTxtOn: { color: "#000" },` |
| `app/record-result.tsx` | `confirmBtn: { backgroundColor: T.textPrimary,` | `confirmBtn: { backgroundColor: T.accent,` |
| `app/onboarding.tsx` | `progressSegActive: { backgroundColor: T.textPrimary },` | `progressSegActive: { backgroundColor: T.accent },` |
| `app/onboarding.tsx` | the `backgroundColor: T.textPrimary,` inside `nextBtn: {` | `backgroundColor: T.accent,` |
| `components/wizard/DetailsStep.tsx` | `chipMvpOn: { backgroundColor: "#ca8a04", borderColor: "#ca8a04" },` | `chipMvpOn: { backgroundColor: T.yellow, borderColor: T.yellow },` |
| `components/wizard/DetailsStep.tsx` | `chipTxtOn: { color: "#fff" },` | `chipTxtOn: { color: "#000" },` |

Button text colours (`color: T.bg`) need no change: `T.bg` is `#000000`, which is the right text colour on the green accent.

Leave `components/wizard/TeamStep.tsx`'s `chipTxtOn: { color: "#fff" }` as-is — there it sits on a team-coloured chip.

Check: `grep -n "#ca8a04" app/record-result.tsx components/wizard/DetailsStep.tsx` — Expected: no output.

- [ ] **Step 5: Retire the legacy token names**

```bash
grep -rlE "T\.(textPrimary|textSecondary|textMuted|border)\b" app components \
  | xargs sed -i -E 's/T\.textPrimary\b/T.text/g; s/T\.textSecondary\b/T.textDim/g; s/T\.textMuted\b/T.textFaint/g; s/T\.border\b/T.divider/g'
grep -rnE "T\.(textPrimary|textSecondary|textMuted|border)\b" app components
```

Expected: the second `grep` prints nothing.

Then in `constants/theme.ts` delete these five lines (the comment and the four aliases):

```ts
  // Legacy names, remapped onto the new palette so every screen re-skins at
  // once. Removed in Task 7 when no file reads them.
  border: "#2B2B2B",
  textPrimary: "#F2F2F2",
  textSecondary: "#A3A3A3",
  textMuted: "#8A8A8A",
```

- [ ] **Step 6: Verify**

Run `VERIFY`. Expected: all four pass. `tsc` is the proof that no file still reads a removed key.

- [ ] **Step 7: Visual check**

Run `SEED`, then `SHOT /league t7-league`, `SHOT /create-player t7-create-player`, `SHOT /create-game t7-create-game`.
Expected: League shows the crest row, a Details card with three grey inputs, colour swatches, `5v5`…`11v11` chips with the active one green, a green "Saved" (dimmed) button, and a Danger zone card with a red-text "Reset all data". The tab bar's active icon is green with a grey pill behind it and a hairline above the bar. Create-player's sliders and Save button are green; create-game's progress segment and Next button are green. No text anywhere renders in weight 800/900.

- [ ] **Step 8: Commit**

```bash
git add -A app components constants
git commit -m "feat(ui): restyle League, tab bar and forms; retire legacy tokens"
```

---

### Task 8: Document the new design system

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/building-ballerz-screens/SKILL.md`

**Interfaces:**
- Consumes: the final token set and kit from Tasks 1–7.
- Produces: docs that match the code.

- [ ] **Step 1: Update `CLAUDE.md`**

In the Commands block, add after the `npm run lint` line:

```bash
npm run check      # Node built-in tests for utils/ (rating bands, next match, head-to-head)
```

Replace the routing block's `game/[id].tsx` line with these two lines:

```
  game/[id].tsx        # Dynamic route: single-game detail / live controls
  player/[id].tsx      # Dynamic route: player detail
```

Replace the whole **Implementation status** paragraph with:

```markdown
**Implementation status:** every screen is built. The tab bar is a custom
`FloatingTabBar` with an animated pill (`(tabs)/_layout.tsx`), not the default
tab bar.
```

Replace everything from `### Design system` up to (not including) `### Player attributes` with:

````markdown
### Design system

FotMob-style, dark only. Spec: `docs/superpowers/specs/2026-10-13-fotmob-redesign-design.md`.

`constants/theme.ts` exports:

| Export | Contents |
|---|---|
| `T` | `bg #000000`, `surface #1A1A1A`, `surfaceAlt #262626`, `divider #2B2B2B`, `text #F2F2F2`, `textDim #A3A3A3`, `textFaint #8A8A8A`, `accent #2FD47A`, `red #F04438`, `yellow #F5C518` |
| `TYPE` | `screenTitle`, `sectionTitle`, `rowPrimary`, `rowSecondary`, `caption`, `score` text styles |
| `SPACE` / `RADIUS` | 4-pt spacing scale; `card 16`, `control 12`, `badge 8` |

Rules: cards have no border; weights 400–700 only; every number uses
`fontVariant: ["tabular-nums"]`; the league colour appears on crests only; the
green accent is for active state, live and primary actions — use it sparingly.

Build screens from `components/ui/`: `ScreenHeader`, `IconButton`, `Section`,
`ListRow`, `Tabs`, `RatingBadge`, `StatCompare`, `Button`, `EmptyState`.
`components/Crest.tsx` renders team crests and (`variant="avatar"`) neutral
player avatars. `GameCard` is a compact match row; `GameScoreboard` is the
card-less match header. `Colors`/`Fonts` in `theme.ts` are Expo template
leftovers — don't use them.

Styling is `StyleSheet.create` per file. Pure logic that screens need lives in
import-free files under `utils/` so `npm run check` can test it with Node.
````

- [ ] **Step 2: Update `.claude/skills/building-ballerz-screens/SKILL.md`**

Replace its whole `## Styling` section (from that heading up to the next `##`) with:

```markdown
## Styling

FotMob-style dark UI. `T` from `constants/theme.ts`: `bg #000000` ·
`surface #1A1A1A` · `surfaceAlt #262626` · `divider #2B2B2B` · `text #F2F2F2` ·
`textDim #A3A3A3` · `textFaint #8A8A8A` · `accent #2FD47A` · `red` · `yellow`.
`TYPE`, `SPACE` and `RADIUS` hold the type scale, spacing and radii.

Compose screens from `components/ui/` (`ScreenHeader`, `Section`, `ListRow`,
`Tabs`, `RatingBadge`, `StatCompare`, `Button`, `IconButton`, `EmptyState`)
before writing new styles. Cards have no border, weights stop at 700, numbers
are tabular, and the green accent marks active, live and primary — nothing
decorative. No watermark icons, no letter-spaced eyebrow labels, no gradients.

Player photos and league logos are local `file://` URIs from
`expo-image-picker`. `Crest` shows them, falling back to initials (team colour
for teams, neutral grey with `variant="avatar"` for players).
```

- [ ] **Step 3: Verify**

Run: `grep -n "textPrimary\|#2E385B\|placeholder stubs" CLAUDE.md .claude/skills/building-ballerz-screens/SKILL.md`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md .claude/skills/building-ballerz-screens/SKILL.md
git commit -m "docs: document the FotMob-style design system"
```
