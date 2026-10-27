import { test } from "node:test";
import assert from "node:assert/strict";
import { computePlayerRivalries, computeTeamOfLeague } from "../../utils/rivalries.ts";

const dan = { id: "p1", name: "Dan" };
const omer = { id: "p2", name: "Omer" };
const noam = { id: "p3", name: "Noam" };

const game = (date, homeTeam, homeScore, awayScore, awayTeam, homePlayers = [], awayPlayers = [], status = "FT") => ({
  status, date, homeTeam, awayTeam, homeScore, awayScore,
  homeColor: "#111111", awayColor: "#222222", homePlayers, awayPlayers,
});

test("two players become rivals after three games on opposite sides", () => {
  const games = [
    game("01/10/2026", "A", 2, 0, "B", [dan], [omer]),
    game("08/10/2026", "A", 0, 1, "B", [omer], [dan]),
  ];
  assert.deepEqual(computePlayerRivalries(games), []);
  const r = computePlayerRivalries([...games, game("15/10/2026", "A", 1, 1, "B", [dan], [omer])]);
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].a.id, r[0].b.id, r[0].meetings], ["p1", "p2", 3]);
  // Dan won the first (home) and the second (away), the third was a draw.
  assert.deepEqual([r[0].winsA, r[0].draws, r[0].winsB], [2, 1, 0]);
});

test("team-mates and unfinished games never count", () => {
  const games = [1, 2, 3].map((d) => game(`0${d}/10/2026`, "A", 1, 0, "B", [dan, noam], [omer]));
  games.push(game("09/10/2026", "A", 1, 0, "B", [dan], [omer], "Pending"));
  const r = computePlayerRivalries(games);
  assert.deepEqual(r.map((x) => `${x.a.id}-${x.b.id}:${x.meetings}`), ["p1-p2:3", "p2-p3:3"]);
});

test("the team with three or more wins and the most of them is team of the league", () => {
  const games = [
    game("01/10/2026", "Reds", 2, 0, "Blues"),
    game("02/10/2026", "reds ", 1, 0, "Greens"),
    game("03/10/2026", "Blues", 0, 3, "Reds"),
    game("04/10/2026", "Reds", 1, 1, "Blues"),
  ];
  const t = computeTeamOfLeague(games);
  assert.equal(t.name, "Reds");
  assert.deepEqual([t.played, t.wins, t.draws, t.losses, t.winRate], [4, 3, 1, 0, 75]);
  assert.deepEqual(t.form, ["W", "W", "W", "D"]);
});

test("no team of the league below three wins", () => {
  assert.equal(computeTeamOfLeague([game("01/10/2026", "Reds", 2, 0, "Blues"), game("02/10/2026", "Reds", 2, 0, "Blues")]), null);
});
