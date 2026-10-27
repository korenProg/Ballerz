// Kept import-free so `npm run check` can load it with plain Node.

export type Result = "W" | "D" | "L";

type StatsGame = {
  id: string;
  status: string;
  date?: string;
  homeScore: number;
  awayScore: number;
  homePlayers?: readonly { id: string }[];
  awayPlayers?: readonly { id: string }[];
  mvp?: { name: string };
};

export type PlayerGame<G> = { game: G; result: Result; wasMvp: boolean };

export type PlayerStats<G> = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  // Whole percent of games played that were won; 0 before the first game.
  winRate: number;
  // Every finished game the player was in a lineup for, newest first.
  games: PlayerGame<G>[];
};

// DD/MM/YYYY → sortable number (same rule as utils/game.ts parseGameDate).
// Undated or malformed games sort as oldest.
function dateKey(date?: string): number {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  const t = new Date(year, month - 1, day).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// A player's record, taken only from finished games whose lineup includes
// them. A game's MVP is stored by name, so `wasMvp` matches on the name.
export function computePlayerStats<G extends StatsGame>(
  player: { id: string; name: string },
  games: readonly G[],
): PlayerStats<G> {
  const mine: PlayerGame<G>[] = [];
  for (const g of games) {
    if (g.status !== "FT") continue;
    const home = (g.homePlayers ?? []).some((p) => p.id === player.id);
    const away = !home && (g.awayPlayers ?? []).some((p) => p.id === player.id);
    if (!home && !away) continue;
    const ours = home ? g.homeScore : g.awayScore;
    const theirs = home ? g.awayScore : g.homeScore;
    const result: Result = ours > theirs ? "W" : ours < theirs ? "L" : "D";
    mine.push({ game: g, result, wasMvp: !!g.mvp?.name && sameName(g.mvp.name, player.name) });
  }
  mine.sort((a, b) => dateKey(b.game.date) - dateKey(a.game.date));

  const count = (r: Result) => mine.filter((m) => m.result === r).length;
  const wins = count("W");
  return {
    played: mine.length,
    wins,
    draws: count("D"),
    losses: count("L"),
    winRate: mine.length ? Math.round((wins / mine.length) * 100) : 0,
    games: mine,
  };
}

// The last `n` results, oldest first, so the newest reads at the right end.
export function recentForm(games: readonly { result: Result }[], n = 5): Result[] {
  return games.slice(0, n).map((g) => g.result).reverse();
}
