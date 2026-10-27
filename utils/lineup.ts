// Kept import-free so `npm run check` can load it with plain Node.

export const LINES = ["GK", "DEF", "MID", "FWD"] as const;
export type Line = (typeof LINES)[number];

// A side's players split into pitch lines, keeping their pick order inside
// each line. An unknown position plays in midfield.
export function groupLineup<P extends { position: string }>(players: readonly P[]): Record<Line, P[]> {
  const lines: Record<Line, P[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) {
    const line = (LINES as readonly string[]).includes(p.position) ? (p.position as Line) : "MID";
    lines[line].push(p);
  }
  return lines;
}

// Outfield shape the way FotMob prints it: "2-2-1". Empty lines are skipped,
// the keeper is never counted, and a side with no outfield players gives "".
export function formation(lines: Record<Line, readonly unknown[]>): string {
  return [lines.DEF.length, lines.MID.length, lines.FWD.length].filter((n) => n > 0).join("-");
}

// The name printed under a player on the pitch: the last word ("Cohen").
export function pitchName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words[words.length - 1] ?? "";
}
