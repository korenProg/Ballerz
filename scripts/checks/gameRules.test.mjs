import { test } from "node:test";
import assert from "node:assert/strict";
import { teamNamesClash, DEFAULT_HOME_TEAM, DEFAULT_AWAY_TEAM } from "../../utils/gameRules.ts";

test("the same name on both sides clashes, ignoring case and spacing", () => {
  assert.equal(teamNamesClash("Reds", "Reds"), true);
  assert.equal(teamNamesClash("Reds", " reds "), true);
  assert.equal(teamNamesClash("Real  Madrid", "real madrid"), true);
});

test("different names do not clash", () => {
  assert.equal(teamNamesClash("Reds", "Blues"), false);
});

test("blank names never clash", () => {
  assert.equal(teamNamesClash("", ""), false);
  assert.equal(teamNamesClash("  ", " "), false);
});

test("the default team names are distinct", () => {
  assert.equal(teamNamesClash(DEFAULT_HOME_TEAM, DEFAULT_AWAY_TEAM), false);
});
