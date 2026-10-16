const UNKNOWN = "Unknown";

function listNames(value, pick) {
  if (!value) return "";
  const items = Array.isArray(value) ? value : Object.values(value);
  return items.map(pick).filter(Boolean).join(", ");
}

function formatPopulation(n) {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "";
}

function currencyCodeOf(currencies) {
  if (!currencies) return "";
  if (Array.isArray(currencies)) return currencies[0]?.code || "";
  return Object.keys(currencies)[0] || "";
}

function normalizeV5(obj) {
  return {
    country: obj.names?.common || UNKNOWN,
    capital: obj.capitals?.[0]?.name || UNKNOWN,
    region: obj.region || UNKNOWN,
    population: formatPopulation(obj.population),
    flag: obj.flag?.url_svg || obj.flag?.url_png || "",
    currencies: listNames(obj.currencies, (c) => c?.name),
    currencyCode: currencyCodeOf(obj.currencies),
    languages: listNames(obj.languages, (l) => (typeof l === "string" ? l : l?.name)),
  };
}

function normalizeV31(c) {
  return {
    country: c.name?.common || UNKNOWN,
    capital: Array.isArray(c.capital) ? c.capital[0] || UNKNOWN : c.capital || UNKNOWN,
    region: c.region || UNKNOWN,
    population: formatPopulation(c.population),
    flag: c.flags?.svg || c.flags?.png || "",
    currencies: listNames(c.currencies, (x) => x?.name),
    currencyCode: currencyCodeOf(c.currencies),
    languages: listNames(c.languages, (l) => l),
  };
}

module.exports = { normalizeV5, normalizeV31 };
