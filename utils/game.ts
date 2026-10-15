// Date strings throughout the app are DD/MM/YYYY.
export function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export function parseGameDate(date?: string): number {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

// Parse a DD/MM/YYYY string into a Date (for the native date picker).
// Falls back to today for empty/invalid input.
export function parseDMY(date?: string): Date {
  if (!date) return new Date();
  const [d, m, y] = date.split("/").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return isNaN(dt.getTime()) ? new Date() : dt;
}

export function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
    const parsed = g.date ? parseGameDate(g.date) : Infinity;
    const key = Number.isNaN(parsed) ? Infinity : parsed;
    if (best === null || key < bestKey) {
      best = g;
      bestKey = key;
    }
  }
  return best;
}

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
