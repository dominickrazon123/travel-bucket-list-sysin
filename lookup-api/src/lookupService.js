const { normalizeV5, normalizeV31 } = require("./normalize");

class UpstreamError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function createLookupService({ apiKey, v5Url, legacyUrl, maxResults, fetchImpl = fetch }) {
  async function searchV5(query) {
    const url =
      `${v5Url}?q=${encodeURIComponent(query)}&limit=${maxResults}` +
      "&response_fields=names.common,capitals,region,population,currencies,languages,flag";
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
      throw new UpstreamError(`Country API error ${res.status}. Check RESTCOUNTRIES_API_KEY.`, 502);
    }
    const body = await res.json();
    return (body.data?.objects || []).map(normalizeV5);
  }

  async function searchLegacy(query) {
    const res = await fetchImpl(`${legacyUrl}/${encodeURIComponent(query)}`);
    if (res.status === 404) return [];
    if (!res.ok) {
      throw new UpstreamError(
        `The old country API returned ${res.status}. Set RESTCOUNTRIES_API_KEY to use the new one.`,
        502
      );
    }
    const data = await res.json().catch(() => []);
    return (Array.isArray(data) ? data : []).map(normalizeV31);
  }

  return {
    async search(query) {
      const results = apiKey ? await searchV5(query) : await searchLegacy(query);
      return results.slice(0, maxResults);
    },
  };
}

module.exports = { createLookupService, UpstreamError };
