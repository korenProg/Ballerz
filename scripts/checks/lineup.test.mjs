import { test } from "node:test";
import assert from "node:assert/strict";
import { groupLineup, formation, pitchName } from "../../utils/lineup.ts";
import { computeHeadToHead } from "../../utils/game.ts";

const p = (name, position) => ({ name, position });

test("players are grouped into lines, unknown positions in midfield", () => {
  const lines = groupLineup([p("A", "GK"), p("B", "DEF"), p("C", "Winger"), p("D", "FWD"), p("E", "DEF")]);
  assert.deepEqual(lines.GK.map((x) => x.name), ["A"]);
  assert.deepEqual(lines.DEF.map((x) => x.name), ["B", "E"]);
  assert.deepEqual(lines.MID.map((x) => x.name), ["C"]);
  assert.deepEqual(lines.FWD.map((x) => x.name), ["D"]);
});

test("formation counts outfield lines and skips empty ones", () => {
  assert.equal(formation(groupLineup([p("A", "GK"), p("B", "DEF"), p("C", "DEF"), p("D", "FWD")])), "2-1");
  assert.equal(formation(groupLineup([p("A", "GK")])), "");
});

test("the pitch shows a player's last name", () => {
  assert.equal(pitchName("Daniel Cohen"), "Cohen");
  assert.equal(pitchName(" Messi "), "Messi");
});

const game = (date, homeTeam, homeScore, awayScore, awayTeam, status = "FT") =>
  ({ status, date, homeTeam, awayTeam, homeScore, awayScore });

test("head-to-head counts both fixture directions and credits wins by name", () => {
  const h = computeHeadToHead(
    [
      game("01/10/2026", "Reds", 2, 1, "Blues"),
      game("08/10/2026", "blues ", 3, 0, "Reds"),
      game("15/10/2026", "Reds", 1, 1, "Blues"),
      game("20/10/2026", "Reds", 5, 0, "Greens"),
      game("22/10/2026", "Reds", 0, 0, "Blues", "Pending"),
    ],
    "Reds",
    "Blues"
  );
  assert.deepEqual([h.played, h.winsA, h.draws, h.winsB], [3, 1, 1, 1]);
  assert.deepEqual(h.meetings.map((m) => m.date), ["15/10/2026", "08/10/2026", "01/10/2026"]);
});
