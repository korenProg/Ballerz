export type GamePlayer = {
  id: string;
  name: string;
  position: string;
};

export type Game = {
  id: string;
  date?: string;
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
  homePlayers?: GamePlayer[];
  awayPlayers?: GamePlayer[];
};

export type ExportMode = "options" | "result" | "preview" | "teamsheet";
