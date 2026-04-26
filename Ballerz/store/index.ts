import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Player } from "../types/players";
import type { Game } from "../types/games";
import type { League } from "../types/league";

const genId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

interface BallerzStore {
  players: Player[];
  games: Game[];
  league: League;
  hasOnboarded: boolean;

  addPlayer: (player: Omit<Player, "id">) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  setMvp: (playerId: string) => void;

  addGame: (game: Omit<Game, "id">) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  finishGame: (
    id: string,
    homeScore: number,
    awayScore: number,
    mvpName: string,
    mvpStat: string
  ) => void;

  setLeague: (updates: Partial<League>) => void;
  completeOnboarding: () => void;
}

export const useStore = create<BallerzStore>()(
  persist(
    (set) => ({
      players: [],
      games: [],
      league: {
        name: "",
        logoUri: null,
        color: "#0039a3",
        defaultLocation: "",
        defaultTeamSize: 5,
        adminName: "",
      },
      hasOnboarded: false,

      addPlayer: (player) =>
        set((s) => ({
          players: [...s.players, { ...player, id: genId() }],
        })),

      updatePlayer: (id, updates) =>
        set((s) => ({
          players: s.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePlayer: (id) =>
        set((s) => ({ players: s.players.filter((p) => p.id !== id) })),

      setMvp: (playerId) =>
        set((s) => ({
          players: s.players.map((p) => ({
            ...p,
            isMvp: p.id === playerId,
          })),
        })),

      addGame: (game) =>
        set((s) => ({
          games: [...s.games, { ...game, id: genId() }],
        })),

      updateGame: (id, updates) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGame: (id) =>
        set((s) => ({ games: s.games.filter((g) => g.id !== id) })),

      finishGame: (id, homeScore, awayScore, mvpName, mvpStat) =>
        set((s) => ({
          games: s.games.map((g) =>
            g.id === id
              ? {
                  ...g,
                  status: "FT" as const,
                  homeScore,
                  awayScore,
                  mvp: { name: mvpName, stat: mvpStat },
                }
              : g
          ),
        })),

      setLeague: (updates) =>
        set((s) => ({ league: { ...s.league, ...updates } })),

      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: "ballerz-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
