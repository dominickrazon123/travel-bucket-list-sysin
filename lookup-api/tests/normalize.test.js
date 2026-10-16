const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeV5, normalizeV31 } = require("../src/normalize");

test("normalizeV5 maps the fields the UI reads", () => {
  const out = normalizeV5({
    names: { common: "Germany" },
    capitals: [{ name: "Berlin" }],
    region: "Europe",
    population: 83000000,
    flag: { url_png: "https://x/de.png" },
    currencies: [{ code: "EUR", name: "Euro" }],
    languages: [{ name: "German" }],
  });
  assert.deepEqual(out, {
    country: "Germany", capital: "Berlin", region: "Europe", population: "83,000,000",
    flag: "https://x/de.png", currencies: "Euro", currencyCode: "EUR", languages: "German",
  });
});

test("normalizeV5 falls back to Unknown and empty strings", () => {
  const out = normalizeV5({});
  assert.equal(out.country, "Unknown");
  assert.equal(out.capital, "Unknown");
  assert.equal(out.region, "Unknown");
  assert.equal(out.population, "");
  assert.equal(out.currencyCode, "");
});

test("normalizeV31 maps the legacy response shape", () => {
  const out = normalizeV31({
    name: { common: "Japan" },
    capital: ["Tokyo"],
    region: "Asia",
    population: 125000000,
    flags: { svg: "https://x/jp.svg" },
    currencies: { JPY: { name: "Japanese yen" } },
    languages: { jpn: "Japanese" },
  });
  assert.equal(out.capital, "Tokyo");
  assert.equal(out.currencyCode, "JPY");
  assert.equal(out.currencies, "Japanese yen");
  assert.equal(out.languages, "Japanese");
  assert.equal(out.flag, "https://x/jp.svg");
});
