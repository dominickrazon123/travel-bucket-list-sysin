const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createLookupService } = require("../src/lookupService");

const baseConfig = { v5Url: "https://v5.test", legacyUrl: "https://legacy.test", maxResults: 5 };

async function withServer(config, fetchImpl, run) {
  const app = createApp(createLookupService({ ...baseConfig, ...config, fetchImpl }));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(async (path) => {
      const res = await fetch(base + path);
      return { status: res.status, data: await res.json() };
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const jsonResponse = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test("GET /health returns 200", () =>
  withServer({ apiKey: "" }, async () => jsonResponse(200, []), async (get) => {
    const res = await get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "ok");
  }));

test("empty query returns an empty list without calling upstream", () => {
  let called = false;
  return withServer({ apiKey: "k" }, async () => { called = true; return jsonResponse(200, {}); }, async (get) => {
    const res = await get("/api/lookup?country=%20");
    assert.deepEqual(res.data, []);
    assert.equal(called, false);
  });
});

test("v5 search sends the bearer key and normalizes results", () => {
  let seen;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return jsonResponse(200, { data: { objects: [{ names: { common: "Peru" }, capitals: [{ name: "Lima" }], region: "Americas" }] } });
  };
  return withServer({ apiKey: "secret" }, fetchImpl, async (get) => {
    const res = await get("/api/lookup?country=peru");
    assert.equal(res.status, 200);
    assert.equal(res.data[0].country, "Peru");
    assert.equal(res.data[0].capital, "Lima");
    assert.equal(seen.options.headers.Authorization, "Bearer secret");
    assert.match(seen.url, /q=peru/);
  });
});

test("v5 upstream failure becomes a 502 with a readable message", () =>
  withServer({ apiKey: "bad" }, async () => jsonResponse(401, {}), async (get) => {
    const res = await get("/api/lookup?country=peru");
    assert.equal(res.status, 502);
    assert.match(res.data.message, /401/);
  }));

test("legacy search is used when no key is set and 404 means no results", () => {
  const fetchImpl = async (url) => {
    assert.match(url, /legacy\.test/);
    return jsonResponse(404, {});
  };
  return withServer({ apiKey: "" }, fetchImpl, async (get) => {
    const res = await get("/api/lookup?q=zzzz");
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, []);
  });
});

test("network failure becomes a 500 with a readable message", () =>
  withServer({ apiKey: "k" }, async () => { throw new Error("offline"); }, async (get) => {
    const res = await get("/api/lookup?country=peru");
    assert.equal(res.status, 500);
    assert.match(res.data.message, /Could not reach/);
  }));

test("results are capped at five", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ name: { common: `C${i}` } }));
  return withServer({ apiKey: "" }, async () => jsonResponse(200, many), async (get) => {
    const res = await get("/api/lookup?country=c");
    assert.equal(res.data.length, 5);
  });
});
