const TIERS = ["low", "mid", "high"];
const STATUSES = ["planned", "visited"];

const TEXT_LIMITS = {
  country: 100,
  capital: 255,
  note: 2000,
  region: 100,
  population: 50,
  languages: 500,
  currencies: 500,
  currencyCode: 10,
};

const isBlank = (v) => v === undefined || v === null || v === "";

function parseDate(raw) {
  const text = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return undefined;
  return text;
}

function parseDestination(body, { partial = false } = {}) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const value = {};

  for (const [field, limit] of Object.entries(TEXT_LIMITS)) {
    if (input[field] === undefined) continue;
    const text = input[field] === null ? "" : String(input[field]).trim();
    if (text.length > limit) return { error: `${field} must be at most ${limit} characters` };
    value[field] = text;
  }

  if (value.country === "" || (!partial && value.country === undefined)) {
    return { error: "Country is required" };
  }

  if (input.date !== undefined) {
    if (isBlank(input.date)) {
      value.date = null;
    } else {
      const date = parseDate(input.date);
      if (!date) return { error: "Date must be a valid YYYY-MM-DD date" };
      value.date = date;
    }
  }

  if (input.days !== undefined) {
    if (isBlank(input.days)) {
      value.days = null;
    } else {
      const text = String(input.days).trim();
      const days = Number(text);
      if (!/^\d+$/.test(text) || days < 1 || days > 365) {
        return { error: "Days must be a whole number between 1 and 365" };
      }
      value.days = days;
    }
  }

  if (input.tier !== undefined) {
    if (!TIERS.includes(input.tier)) return { error: "Budget must be low, mid or high" };
    value.tier = input.tier;
  }

  if (input.status !== undefined) {
    if (!STATUSES.includes(input.status)) return { error: "Status must be planned or visited" };
    value.status = input.status;
  }

  if (input.favorite !== undefined) {
    if (typeof input.favorite !== "boolean") return { error: "Favorite must be true or false" };
    value.favorite = input.favorite;
  }

  return { value };
}

function parseId(raw) {
  const text = String(raw);
  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  return id >= 1 && id <= 2147483647 ? id : null;
}

function parseIds(body) {
  const ids = body && body.ids;
  if (!Array.isArray(ids) || ids.length > 1000) return null;
  const valid = ids.every((id) => Number.isInteger(id) && id >= 1 && id <= 2147483647);
  return valid && new Set(ids).size === ids.length ? ids : null;
}

module.exports = { parseDestination, parseId, parseIds, TIERS, STATUSES };
