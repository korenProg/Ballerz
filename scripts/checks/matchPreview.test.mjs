import { test } from "node:test";
import assert from "node:assert/strict";
import { teamProfile, winProbability } from "../../utils/matchPreview.ts";

const player = (id, ovr) => ({ id, ovr, pac: ovr, sho: ovr, pas: ovr, dri: ovr, def: ovr, phy: ovr });
const roster = [player("a", 80), player("b", 70), player("c", 60), player("d", 60), player("e", 90)];
const line = (id, position) => ({ id, position });

test("a profile averages the lineup's OVR and attributes and counts its lines", () => {
  const t = teamProfile([line("a", "GK"), line("b", "FWD")], roster, []);
  assert.equal(t.size, 2);
  assert.equal(t.ovr, 75);
  assert.equal(t.attrs.pac, 75);
  assert.equal(t.coverage, 0.5);
  assert.equal(t.form, null);
});

test("form is the points share over each player's recent finished games", () => {
  const games = [
    { id: "g1", status: "FT", date: "01/10/2026", homeScore: 2, awayScore: 0, homePlayers: [{ id: "a" }], awayPlayers: [] },
    { id: "g2", status: "FT", date: "08/10/2026", homeScore: 1, awayScore: 1, homePlayers: [{ id: "a" }], awayPlayers: [] },
    { id: "g3", status: "Pending", date: "15/10/2026", homeScore: 0, awayScore: 0, homePlayers: [{ id: "a" }], awayPlayers: [] },
  ];
  const t = teamProfile([line("a", "MID")], roster, games);
  assert.ok(Math.abs(t.form - (1 + 1 / 3) / 2) < 1e-9);
});

test("percentages always sum to 100 and even sides split evenly", () => {
  const side = teamProfile([line("c", "DEF"), line("d", "FWD")], roster, []);
  const p = winProbability(side, side);
  assert.equal(p.home + p.draw + p.away, 100);
  assert.equal(p.home, p.away);
  assert.ok(p.draw >= 20);
});

test("the stronger lineup is the favourite", () => {
  const strong = teamProfile([line("e", "GK"), line("a", "FWD")], roster, []);
  const weak = teamProfile([line("c", "GK"), line("d", "FWD")], roster, []);
  const p = winProbability(strong, weak);
  assert.ok(p.home > p.away);
  assert.equal(p.home + p.draw + p.away, 100);
});

test("no prediction until both sides have players", () => {
  const side = teamProfile([line("a", "GK")], roster, []);
  assert.equal(winProbability(side, teamProfile([], roster, [])), null);
});
