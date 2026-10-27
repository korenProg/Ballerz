import { test } from "node:test";
import assert from "node:assert/strict";
import { groupLineup, formation, pitchName } from "../../utils/lineup.ts";

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
