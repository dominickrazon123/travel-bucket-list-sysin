const test = require("node:test");
const assert = require("node:assert/strict");
const { parseDestination, parseId, parseIds } = require("../src/validation");

test("create requires a country", () => {
  assert.equal(parseDestination({}).error, "Country is required");
  assert.equal(parseDestination({ country: "   " }).error, "Country is required");
});

test("create trims text and keeps optional fields", () => {
  const { value, error } = parseDestination({ country: "  Japan ", capital: " Tokyo ", note: " sakura " });
  assert.equal(error, undefined);
  assert.deepEqual(value, { country: "Japan", capital: "Tokyo", note: "sakura" });
});

test("partial update does not require a country but rejects clearing it", () => {
  assert.deepEqual(parseDestination({ favorite: true }, { partial: true }).value, { favorite: true });
  assert.equal(parseDestination({ country: "" }, { partial: true }).error, "Country is required");
});

test("days accepts digits 1 to 365 and blank clears it", () => {
  assert.equal(parseDestination({ country: "A", days: "7" }).value.days, 7);
  assert.equal(parseDestination({ country: "A", days: "" }).value.days, null);
  assert.match(parseDestination({ country: "A", days: "0" }).error, /Days/);
  assert.match(parseDestination({ country: "A", days: "366" }).error, /Days/);
  assert.match(parseDestination({ country: "A", days: "3.5" }).error, /Days/);
  assert.match(parseDestination({ country: "A", days: "abc" }).error, /Days/);
});

test("date accepts real calendar dates only and blank clears it", () => {
  assert.equal(parseDestination({ country: "A", date: "2027-03-15" }).value.date, "2027-03-15");
  assert.equal(parseDestination({ country: "A", date: "" }).value.date, null);
  assert.match(parseDestination({ country: "A", date: "2027-02-30" }).error, /Date/);
  assert.match(parseDestination({ country: "A", date: "15/03/2027" }).error, /Date/);
});

test("tier and status only accept known values", () => {
  assert.equal(parseDestination({ country: "A", tier: "high" }).value.tier, "high");
  assert.match(parseDestination({ country: "A", tier: "luxury" }).error, /Budget/);
  assert.equal(parseDestination({ country: "A", status: "visited" }).value.status, "visited");
  assert.match(parseDestination({ country: "A", status: "done" }).error, /Status/);
});

test("favorite must be a boolean", () => {
  assert.equal(parseDestination({ country: "A", favorite: false }).value.favorite, false);
  assert.match(parseDestination({ country: "A", favorite: "yes" }).error, /Favorite/);
});

test("overlong text is rejected", () => {
  assert.match(parseDestination({ country: "x".repeat(101) }).error, /country/);
});

test("parseId accepts positive integers only", () => {
  assert.equal(parseId("12"), 12);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("abc"), null);
  assert.equal(parseId("1.5"), null);
  assert.equal(parseId("99999999999"), null);
});

test("parseIds needs a unique list of positive integers", () => {
  assert.deepEqual(parseIds({ ids: [3, 1, 2] }), [3, 1, 2]);
  assert.equal(parseIds({ ids: [1, 1] }), null);
  assert.equal(parseIds({ ids: ["1"] }), null);
  assert.equal(parseIds({}), null);
});
