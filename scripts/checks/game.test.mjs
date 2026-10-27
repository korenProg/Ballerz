import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNextGame, shortDate } from "../../utils/game.ts";

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
