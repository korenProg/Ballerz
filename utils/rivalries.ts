// Kept import-free so `npm run check` can load it with plain Node.

export type Result = "W" | "D" | "L";

type LeagueGame = {
  status: string;
  date?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeColor?: string;
  awayColor?: string;
  homeLogo?: string;
  awayLogo?: string;
  homePlayers?: readonly { id: string; name: string }[];
  awayPlayers?: readonly { id: string; name: string }[];
};

// Players must face each other this often before they count as a rivalry,
// and a team must win this often to be team of the league.
export const MIN_MEETINGS = 3;
export const MIN_TEAM_WINS = 3;

// DD/MM/YYYY → sortable number (same rule as utils/game.ts parseGameDate).
function dateKey(date?: string): number {
  if (!date) return 0;
  const [day, month, year] = date.split("/").map(Number);
  const t = new Date(year, month - 1, day).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Finished games, oldest first, so later games overwrite names and colours.
const finishedOldestFirst = <G extends LeagueGame>(games: readonly G[]) =>
  games.filter((g) => g.status === "FT").sort((a, b) => dateKey(a.date) - dateKey(b.date));

export type PlayerRivalry = {
  a: { id: string; name: string };
  b: { id: string; name: string };
  meetings: number;
  winsA: number;
  winsB: number;
  draws: number;
};

// Every pair of players who were on opposite sides in at least `minMeetings`
// finished games, most meetings first. Names are taken from the latest game.
export function computePlayerRivalries(games: readonly LeagueGame[], minMeetings = MIN_MEETINGS): PlayerRivalry[] {
  const pairs = new Map<string, PlayerRivalry & { last: number }>();
  for (const g of finishedOldestFirst(games)) {
    const homeWon = g.homeScore > g.awayScore;
    const draw = g.homeScore === g.awayScore;
    for (const h of g.homePlayers ?? []) {
      for (const w of g.awayPlayers ?? []) {
        if (h.id === w.id) continue;
        // `a` is always the lower id, so both fixture directions share a key.
        const [a, b] = h.id < w.id ? [h, w] : [w, h];
        const key = `${a.id}|${b.id}`;
        let r = pairs.get(key);
        if (!r) {
          r = { a: { ...a }, b: { ...b }, meetings: 0, winsA: 0, winsB: 0, draws: 0, last: 0 };
          pairs.set(key, r);
        }
        r.a.name = a.name;
        r.b.name = b.name;
        r.meetings++;
        r.last = dateKey(g.date);
        if (draw) r.draws++;
        else if ((homeWon ? h.id : w.id) === a.id) r.winsA++;
        else r.winsB++;
      }
    }
  }
  return [...pairs.values()]
    .filter((r) => r.meetings >= minMeetings)
    .sort((x, y) => y.meetings - x.meetings || y.last - x.last)
    .map(({ last: _last, ...r }) => r);
}

export type TeamOfLeague = {
  name: string;
  color?: string;
  logo?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  // Whole percent of games played that were won.
  winRate: number;
  // The last five results, oldest first.
  form: Result[];
};

const teamKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

// The team (matched by name) with the most wins, once it has `minWins` of them.
// Ties go to the better win rate, then to more games played.
export function computeTeamOfLeague(games: readonly LeagueGame[], minWins = MIN_TEAM_WINS): TeamOfLeague | null {
  const teams = new Map<string, TeamOfLeague & { results: Result[] }>();
  for (const g of finishedOldestFirst(games)) {
    const sides = [
      { name: g.homeTeam, color: g.homeColor, logo: g.homeLogo, ours: g.homeScore, theirs: g.awayScore },
      { name: g.awayTeam, color: g.awayColor, logo: g.awayLogo, ours: g.awayScore, theirs: g.homeScore },
    ];
    for (const s of sides) {
      const key = teamKey(s.name);
      if (!key) continue;
      let t = teams.get(key);
      if (!t) {
        t = { name: s.name, played: 0, wins: 0, draws: 0, losses: 0, winRate: 0, form: [], results: [] };
        teams.set(key, t);
      }
      t.name = s.name.trim();
      t.color = s.color;
      t.logo = s.logo;
      t.played++;
      const r: Result = s.ours > s.theirs ? "W" : s.ours < s.theirs ? "L" : "D";
      if (r === "W") t.wins++;
      else if (r === "D") t.draws++;
      else t.losses++;
      t.results.push(r);
    }
  }
  let best: (TeamOfLeague & { results: Result[] }) | null = null;
  for (const t of teams.values()) {
    t.winRate = Math.round((t.wins / t.played) * 100);
    if (t.wins < minWins) continue;
    if (
      !best ||
      t.wins > best.wins ||
      (t.wins === best.wins && (t.winRate > best.winRate || (t.winRate === best.winRate && t.played > best.played)))
    ) {
      best = t;
    }
  }
  if (!best) return null;
  const { results, ...team } = best;
  return { ...team, form: results.slice(-5) };
}
