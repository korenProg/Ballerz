import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRivalry, pickNextGame, shortDate } from "../../utils/game.ts";

const g = (id, status, date) => ({ id, status, date });

test("shortDate formats DD/MM/YYYY", () => {
  assert.equal(shortDate("18/10/2026"), "18 Oct");
  assert.equal(shortDate("01/01/2027"), "1 Jan");
});

test("shortDate returns TBD for missing or malformed dates", () => {
  assert.equal(shortDate(undefined), "TBD");
  assert.equal(shortDate(""), "TBD");
  assert.equal(shortDate("31/13/2026"), "TBD");
  assert.equal(shortDate("abc"), "TBD");
});

test("next game is a live game when one exists", () => {
  const games = [g("p", "Pending", "13/10/2026"), g("l", "Live", "20/10/2026")];
  assert.equal(pickNextGame(games)?.id, "l");
});

test("next game is the soonest dated fixture, including days past the 12th", () => {
  const games = [g("a", "Pending", "20/10/2026"), g("b", "Pending", "13/10/2026"), g("c", "FT", "01/10/2026")];
  assert.equal(pickNextGame(games)?.id, "b");
});

test("undated fixtures rank after dated ones", () => {
  assert.equal(pickNextGame([g("u", "Pending", undefined), g("d", "Pending", "30/12/2026")])?.id, "d");
  assert.equal(pickNextGame([g("u", "Pending", undefined)])?.id, "u");
});

test("a malformed date ranks after valid dates", () => {
  assert.equal(pickNextGame([g("x", "Pending", "abc"), g("d", "Pending", "20/10/2026")])?.id, "d");
});

test("no live or upcoming game means no next game", () => {
  assert.equal(pickNextGame([g("c", "FT", "01/10/2026")]), null);
  assert.equal(pickNextGame([]), null);
});

const m = (id, date, homeTeam, awayTeam, homeScore, awayScore, status = "FT") => ({
  id, date, status, homeTeam, awayTeam, homeScore, awayScore,
});

test("rivalry credits wins to the team that won, not the home slot", () => {
  const r = computeRivalry([
    m("a", "04/10/2026", "Lions", "Wolves", 4, 2), // Lions win at home
    m("b", "11/10/2026", "Wolves", "Lions", 3, 1), // Wolves win at home
    m("c", "18/10/2026", "Lions", "Wolves", 2, 2), // draw
  ]);
  assert.equal(r.teamA, "Lions");
  assert.equal(r.teamB, "Wolves");
  assert.equal(r.count, 3);
  assert.equal(r.winsA, 1);
  assert.equal(r.winsB, 1);
  assert.equal(r.draws, 1);
  assert.equal(r.lastGame.id, "c");
});

test("rivalry needs two finished meetings", () => {
  assert.equal(computeRivalry([m("a", "04/10/2026", "Lions", "Wolves", 1, 0)]), null);
  assert.equal(
    computeRivalry([
      m("a", "04/10/2026", "Lions", "Wolves", 1, 0),
      m("b", "13/10/2026", "Lions", "Wolves", 0, 0, "Pending"),
    ]),
    null
  );
});

test("rivalry matches team names case- and space-insensitively", () => {
  const r = computeRivalry([
    m("a", "04/10/2026", "Lions", "Wolves", 1, 0),
    m("b", "13/10/2026", " wolves ", "LIONS", 2, 0),
  ]);
  assert.equal(r.count, 2);
  assert.equal(r.winsA + r.winsB, 2);
  assert.equal(r.winsA, 1);
});

test("rivalry picks the most-played pairing", () => {
  const r = computeRivalry([
    m("a", "01/10/2026", "Lions", "Wolves", 1, 0),
    m("b", "02/10/2026", "Lions", "Wolves", 1, 0),
    m("c", "03/10/2026", "Bears", "Hawks", 1, 0),
    m("d", "04/10/2026", "Bears", "Hawks", 1, 0),
    m("e", "05/10/2026", "Bears", "Hawks", 1, 0),
  ]);
  assert.equal(r.teamA, "Bears");
  assert.equal(r.count, 3);
});
