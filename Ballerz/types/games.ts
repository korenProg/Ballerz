export type GamePlayer = {
  id: string;
  name: string;
  position: string;
};

export type GoalEvent = {
  id: string;
  playerId: string;
  playerName: string;
  team: "home" | "away";
  minute: number;
};

export type Game = {
  id: string;
  league: string;
  status: "FT" | "Live" | "Pending";
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  mvp: { name: string; stat: string };
  homeColor: string;
  awayColor: string;
  location?: string;
  homeCaptain?: string;
  awayCaptain?: string;
  homePlayers?: GamePlayer[];
  awayPlayers?: GamePlayer[];
};

export type ExportMode = "options" | "result" | "preview" | "teamsheet";