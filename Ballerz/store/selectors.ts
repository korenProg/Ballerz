import { useShallow } from "zustand/react/shallow";
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
