import { test } from "node:test";
import assert from "node:assert/strict";
import { ratingColor } from "../../utils/rating.ts";

test("rating bands switch exactly at 80, 70 and 60", () => {
  assert.equal(ratingColor(99), "#2FD47A");
  assert.equal(ratingColor(80), "#2FD47A");
  assert.equal(ratingColor(79), "#A3E635");
  assert.equal(ratingColor(70), "#A3E635");
  assert.equal(ratingColor(69), "#F5C518");
  assert.equal(ratingColor(60), "#F5C518");
  assert.equal(ratingColor(59), "#F97316");
  assert.equal(ratingColor(0), "#F97316");
});

test("a non-number rating falls to the lowest band instead of throwing", () => {
  assert.equal(ratingColor(Number.NaN), "#F97316");
});
