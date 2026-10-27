import { test } from "node:test";
import assert from "node:assert/strict";
import { computePlayerStats, recentForm } from "../../utils/playerStats.ts";

const me = { id: "p1", name: "Daniel Cohen" };
const game = (id, date, homeScore, awayScore, side, extra = {}) => ({
  id,
  status: "FT",
  date,
  homeScore,
  awayScore,
  homePlayers: side === "home" ? [{ id: "p1" }] : [{ id: "x" }],
  awayPlayers: side === "away" ? [{ id: "p1" }] : [{ id: "y" }],
  mvp: { name: "", stat: "" },
  ...extra,
});

test("results are read from the player's own side", () => {
  const s = computePlayerStats(me, [
    game("a", "01/10/2026", 3, 1, "home"),
    game("b", "08/10/2026", 3, 1, "away"),
    game("c", "15/10/2026", 2, 2, "away"),
  ]);
  assert.deepEqual([s.played, s.wins, s.draws, s.losses], [3, 1, 1, 1]);
  assert.equal(s.winRate, 33);
});

test("only finished games the player was in count", () => {
  const s = computePlayerStats(me, [
    game("a", "01/10/2026", 1, 0, "home", { status: "Pending" }),
    game("b", "08/10/2026", 1, 0, "home", { status: "Live" }),
    game("c", "15/10/2026", 1, 0, "none"),
  ]);
  assert.equal(s.played, 0);
  assert.equal(s.winRate, 0);
});

test("games are newest first, by DD/MM/YYYY date", () => {
  const s = computePlayerStats(me, [
    game("old", "25/09/2026", 1, 0, "home"),
    game("new", "13/10/2026", 1, 0, "home"),
    game("mid", "02/10/2026", 1, 0, "home"),
  ]);
  assert.deepEqual(s.games.map((g) => g.game.id), ["new", "mid", "old"]);
});

test("the game MVP is matched by name, ignoring case and spaces", () => {
  const s = computePlayerStats(me, [game("a", "01/10/2026", 1, 0, "home", { mvp: { name: " daniel cohen", stat: "" } })]);
  assert.equal(s.games[0].wasMvp, true);
});

test("recent form is the last five, oldest first", () => {
  const games = ["W", "L", "D", "W", "W", "L"].map((result) => ({ result }));
  assert.deepEqual(recentForm(games), ["W", "W", "D", "L", "W"]);
});
