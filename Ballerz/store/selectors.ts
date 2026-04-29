import { useShallow } from "zustand/react/shallow";
import { useStore } from "./index";
import type { Player } from "../types/players";

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
  useStore(
    useShallow((s) => ({
      gamesCount: s.games.length,
      playersCount: s.players.length,
      totalGoals: s.games.reduce(
        (sum, g) => sum + (g.homeScore ?? 0) + (g.awayScore ?? 0),
        0
      ),
    }))
  );

const normalizeTeamKey = (a: string, b: string) =>
  [a, b].map((t) => t.toLowerCase().trim()).sort().join("||");

export const useRivalry = () =>
  useStore(
    useShallow((s) => {
      const counts: Record<string, { home: string; away: string; count: number; homeWins: number; awayWins: number; draws: number; lastGame: typeof s.games[0] | null }> = {};
      s.games.filter((g) => g.status === "FT").forEach((g) => {
        const key = normalizeTeamKey(g.homeTeam, g.awayTeam);
        if (!counts[key]) {
          counts[key] = { home: g.homeTeam, away: g.awayTeam, count: 0, homeWins: 0, awayWins: 0, draws: 0, lastGame: null };
        }
        const entry = counts[key];
        entry.count++;
        if (g.homeScore > g.awayScore) entry.homeWins++;
        else if (g.awayScore > g.homeScore) entry.awayWins++;
        else entry.draws++;
        const gDate = new Date(g.date ?? 0).getTime();
        const lDate = new Date(entry.lastGame?.date ?? 0).getTime();
        if (gDate > lDate) entry.lastGame = g;
      });
      const best = Object.values(counts).sort((a, b) => b.count - a.count)[0];
      if (!best || best.count < 2) return null;
      return best;
    })
  );

type RadarTeam = { label: string; color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };

const avg = (vals: number[]) =>
  vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;

export const useLastGameRadar = (): { home: RadarTeam; away: RadarTeam } | null =>
  useStore(
    useShallow((s) => {
      const last = s.games.filter((g) => g.status === "FT").sort((a, b) =>
        new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
      )[0];
      if (!last) return null;

      const playerMap = new Map<string, Player>(s.players.map((p) => [p.id, p]));

      const stats = (ids: string[]) => {
        const ps = ids.map((id) => playerMap.get(id)).filter(Boolean) as Player[];
        return {
          pac: avg(ps.map((p) => p.pac)),
          sho: avg(ps.map((p) => p.sho)),
          pas: avg(ps.map((p) => p.pas)),
          dri: avg(ps.map((p) => p.dri)),
          def: avg(ps.map((p) => p.def)),
          phy: avg(ps.map((p) => p.phy)),
        };
      };

      const homeIds = (last.homePlayers ?? []).map((p) => p.id);
      const awayIds = (last.awayPlayers ?? []).map((p) => p.id);

      return {
        home: { label: last.homeTeam, color: last.homeColor, ...stats(homeIds) },
        away: { label: last.awayTeam, color: last.awayColor, ...stats(awayIds) },
      };
    })
  );
