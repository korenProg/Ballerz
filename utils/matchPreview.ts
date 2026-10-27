// Kept import-free so `npm run check` can load it with plain Node.

export const ATTRS = ["pac", "sho", "pas", "dri", "def", "phy"] as const;
export type AttrKey = (typeof ATTRS)[number];

type RosterPlayer = { id: string; ovr: number } & Record<AttrKey, number>;
type LineupPlayer = { id: string; position: string };
type PreviewGame = {
  id: string;
  status: string;
  date?: string;
  homeScore: number;
  awayScore: number;
  homePlayers?: readonly { id: string }[];
  awayPlayers?: readonly { id: string }[];
};

export type TeamProfile = {
  // Players in the lineup.
  size: number;
  // Average OVR and attributes of the lineup players still on the roster.
  ovr: number;
  attrs: Record<AttrKey, number>;
  // Average share of points (win 1, draw 1/3, loss 0) over each player's last
  // five finished games; null when nobody has played yet.
  form: number | null;
  // How many of the four lines (GK, DEF, MID, FWD) the lineup fills, 0–1.
  coverage: number;
};

const FORM_GAMES = 5;
const LINES = ["GK", "DEF", "MID", "FWD"];

// DD/MM/YYYY → sortable number (same rule as utils/game.ts parseGameDate).
function dateKey(date?: string): number {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  const t = new Date(year, month - 1, day).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// One player's form: points share over their last FORM_GAMES finished games.
function playerForm(id: string, newestFirst: readonly PreviewGame[]): number | null {
  const points: number[] = [];
  for (const g of newestFirst) {
    if (points.length === FORM_GAMES) break;
    const home = (g.homePlayers ?? []).some((p) => p.id === id);
    const away = !home && (g.awayPlayers ?? []).some((p) => p.id === id);
    if (!home && !away) continue;
    const ours = home ? g.homeScore : g.awayScore;
    const theirs = home ? g.awayScore : g.homeScore;
    points.push(ours > theirs ? 1 : ours === theirs ? 1 / 3 : 0);
  }
  return points.length ? mean(points) : null;
}

// A lineup's strength profile. `history` should leave out the game being
// previewed, so a finished game's own result doesn't feed its prediction.
export function teamProfile(
  lineup: readonly LineupPlayer[],
  roster: readonly RosterPlayer[],
  history: readonly PreviewGame[],
): TeamProfile {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const live = lineup.map((p) => byId.get(p.id)).filter((p): p is RosterPlayer => !!p);
  const attrs = Object.fromEntries(ATTRS.map((k) => [k, Math.round(mean(live.map((p) => p[k])))])) as Record<
    AttrKey,
    number
  >;
  const finished = history.filter((g) => g.status === "FT").sort((a, b) => dateKey(b.date) - dateKey(a.date));
  const forms = lineup.map((p) => playerForm(p.id, finished)).filter((f): f is number => f !== null);
  const lines = new Set(lineup.map((p) => (LINES.includes(p.position) ? p.position : "MID")));
  return {
    size: lineup.length,
    ovr: Math.round(mean(live.map((p) => p.ovr))),
    attrs,
    form: forms.length ? mean(forms) : null,
    coverage: lines.size / LINES.length,
  };
}

export type WinProbability = { home: number; draw: number; away: number };

// One number per side: rating, nudged by form (±8), by filling every line
// (±4) and by playing with more players (4 per extra player).
function strength(t: TeamProfile, opponentSize: number): number {
  const form = t.form ?? 0.5;
  return t.ovr + 16 * (form - 0.5) + 16 * (t.coverage - 0.75) + 4 * (t.size - opponentSize);
}

// Win / draw / win percentages (whole numbers summing to 100), Elo-style:
// a 20-point strength gap makes the stronger side ten times the favourite.
// Draws are likeliest between even sides. Null until both sides have players.
export function winProbability(home: TeamProfile, away: TeamProfile): WinProbability | null {
  if (home.size === 0 || away.size === 0) return null;
  const diff = strength(home, away.size) - strength(away, home.size);
  const pHome = 1 / (1 + Math.pow(10, -diff / 20));
  const draw = 0.26 * Math.exp(-Math.abs(diff) / 25);
  const h = Math.round((1 - draw) * pHome * 100);
  const a = Math.round((1 - draw) * (1 - pHome) * 100);
  return { home: h, draw: 100 - h - a, away: a };
}

// Pitch lines from front to back, with the attributes that make a good one.
// There is no goalkeeping attribute, so a keeper is judged on defending,
// physique and passing (distribution).
export const LINE_WEIGHTS = {
  FWD: { label: "Attack", weights: { sho: 0.4, pac: 0.3, dri: 0.3 } },
  MID: { label: "Midfield", weights: { pas: 0.4, dri: 0.3, phy: 0.3 } },
  DEF: { label: "Defence", weights: { def: 0.5, phy: 0.3, pac: 0.2 } },
  GK: { label: "Goalkeeper", weights: { def: 0.5, phy: 0.3, pas: 0.2 } },
} as const satisfies Record<string, { label: string; weights: Partial<Record<AttrKey, number>> }>;

export type LineKey = keyof typeof LINE_WEIGHTS;
export type LineStrength = { count: number; rating: number | null };

// Each line's rating: its players' weighted attributes, averaged. A line with
// nobody in it (or only deleted players) rates null. Unknown positions play
// in midfield.
export function lineStrengths(
  lineup: readonly LineupPlayer[],
  roster: readonly RosterPlayer[],
): Record<LineKey, LineStrength> {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const out = {} as Record<LineKey, LineStrength>;
  for (const key of Object.keys(LINE_WEIGHTS) as LineKey[]) {
    const inLine = lineup.filter((p) => (p.position in LINE_WEIGHTS ? p.position : "MID") === key);
    const live = inLine.map((p) => byId.get(p.id)).filter((p): p is RosterPlayer => !!p);
    const weights = Object.entries(LINE_WEIGHTS[key].weights) as [AttrKey, number][];
    const scores = live.map((p) => weights.reduce((sum, [attr, w]) => sum + p[attr] * w, 0));
    out[key] = { count: inLine.length, rating: scores.length ? Math.round(mean(scores)) : null };
  }
  return out;
}
