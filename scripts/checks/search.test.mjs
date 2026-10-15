import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesSearch } from "../../utils/search.ts";

test("an empty or blank query matches everything", () => {
  assert.equal(matchesSearch("Daniel Cohen", ""), true);
  assert.equal(matchesSearch("Daniel Cohen", "   "), true);
});

test("matching ignores case", () => {
  assert.equal(matchesSearch("Daniel Cohen", "daniel"), true);
  assert.equal(matchesSearch("Daniel Cohen", "COHEN"), true);
});

test("matching finds a fragment anywhere in the name", () => {
  assert.equal(matchesSearch("Yossi Mizrahi", "zra"), true);
  assert.equal(matchesSearch("Yossi Mizrahi", "omer"), false);
});

test("extra spaces in the query or the name do not break a match", () => {
  assert.equal(matchesSearch("Itay Ben David", "  ben   david "), true);
  assert.equal(matchesSearch("Itay  Ben David", "itay ben"), true);
});
