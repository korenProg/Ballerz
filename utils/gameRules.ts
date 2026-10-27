// Kept import-free so `npm run check` can load it with plain Node.

// A game needs someone on each side, so the league needs two players first.
export const MIN_PLAYERS_FOR_GAME = 2;

// What a new game's teams are called until the user types their own names.
export const DEFAULT_HOME_TEAM = "Team A";
export const DEFAULT_AWAY_TEAM = "Team B";

const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

// Two sides of one match may not share a name ("Reds" vs " reds " included).
// Blank names never clash; they are caught by the required-name check instead.
export function teamNamesClash(home: string, away: string): boolean {
  const h = normalize(home);
  return h.length > 0 && h === normalize(away);
}
