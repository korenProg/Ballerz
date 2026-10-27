import { test } from "node:test";
import assert from "node:assert/strict";
import { initials } from "../../utils/initials.ts";

test("takes the first letter of the first and last words", () => {
  assert.equal(initials("Daniel Cohen"), "DC");
  assert.equal(initials("Yossi Ben David"), "YD");
});

test("a single word gives one letter, upper-cased", () => {
  assert.equal(initials("messi"), "M");
});

test("a blank name gives nothing", () => {
  assert.equal(initials(""), "");
  assert.equal(initials("   "), "");
});

test("extra spaces do not matter", () => {
  assert.equal(initials("  omer   levi "), "OL");
});
