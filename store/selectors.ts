import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "./index";
import type { Player } from "../types/players";
import type { Game } from "../types/games";
import { computeRivalry, parseGameDate, pickNextGame } from "../utils/game";

export const useLastGame = () =>
  useStore((s) => {
    const finished = s.games.filter((g) => g.status === "FT");
    if (!finished.length) return null;
    return finished.reduce((latest, g) =>
      parseGameDate(g.date) > parseGameDate(latest.date) ? g : latest
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

// Most-played pairing with wins credited per team. computeRivalry builds a
// fresh object, so select the stable games slice and memoize the derivation.
export const useRivalry = () => {
  const games = useStore((s) => s.games);
  return useMemo(() => computeRivalry(games), [games]);
};

// Home's "Next match". pickNextGame returns an existing game object (or null),
// so the selector result is referentially stable.
export const useNextGame = () => useStore((s) => pickNextGame(s.games));

type RadarTeam = { label: string; color: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number };

const avg = (vals: number[]) =>
  vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;

// Same stability concern as useGamesByStatus: returning a fresh { home, away }
// object through useShallow loops forever once a finished game exists. Select
// the stable games/players slices and memoize the derived radar instead.
export const useLastGameRadar = (): { home: RadarTeam; away: RadarTeam } | null => {
  const games = useStore((s) => s.games);
  const players = useStore((s) => s.players);
  return useMemo(() => {
    const last = games.filter((g) => g.status === "FT").sort((a, b) =>
      parseGameDate(b.date) - parseGameDate(a.date)
    )[0];
    if (!last) return null;

    const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

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
  }, [games, players]);
};

// Roster sorted by OVR descending, plus the same list grouped by position.
// Same stability rule as useGamesByStatus: select the stable `players` slice
// and derive here, rather than returning fresh arrays through useShallow.
export const usePlayersByPosition = () => {
  const players = useStore((s) => s.players);
  return useMemo(() => {
    const byOvrDesc = (a: Player, b: Player) => b.ovr - a.ovr;
    const all = [...players].sort(byOvrDesc);
    return {
      all,
      GK: all.filter((p) => p.position === "GK"),
      DEF: all.filter((p) => p.position === "DEF"),
      MID: all.filter((p) => p.position === "MID"),
      FWD: all.filter((p) => p.position === "FWD"),
    };
  }, [players]);
};

// Select the stable `games` array (referentially stable across renders unless
// games actually change) and derive the grouped object via useMemo. Returning
// freshly-filtered arrays through useShallow would never compare equal, making
// useSyncExternalStore re-render forever ("Maximum update depth exceeded").
export const useGamesByStatus = () => {
  const games = useStore((s) => s.games);
  return useMemo(() => {
    const byDateDesc = (a: Game, b: Game) =>
      parseGameDate(b.date) - parseGameDate(a.date);
    const byDateAsc = (a: Game, b: Game) =>
      parseGameDate(a.date) - parseGameDate(b.date);
    return {
      live: games.filter((g) => g.status === "Live").sort(byDateDesc),
      upcoming: games.filter((g) => g.status === "Pending").sort(byDateAsc),
      results: games.filter((g) => g.status === "FT").sort(byDateDesc),
    };
  }, [games]);
};
