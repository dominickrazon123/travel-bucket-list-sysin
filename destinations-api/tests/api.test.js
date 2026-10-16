const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createFakeRepository } = require("./fakeRepository");

async function withServer(run) {
  const repo = createFakeRepository();
  const server = createApp(repo).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  };
  try {
    await run(call, repo);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /health returns 200 when the database is reachable", () =>
  withServer(async (call) => {
    const res = await call("GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "ok");
  }));

test("GET /health returns 503 when the database is down", () =>
  withServer(async (call, repo) => {
    repo.state.healthy = false;
    const res = await call("GET", "/health");
    assert.equal(res.status, 503);
  }));

test("POST creates a destination with every field the UI sends", () =>
  withServer(async (call) => {
    const res = await call("POST", "/api/destinations", {
      country: "Japan", capital: "Tokyo", note: "ramen", date: "2027-04-01", days: "10", tier: "high",
      region: "Asia", population: "125,000,000", languages: "Japanese", currencies: "Japanese yen", currencyCode: "JPY",
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.country, "Japan");
    assert.equal(res.data.days, 10);
    assert.equal(res.data.tier, "high");
    assert.equal(res.data.currencyCode, "JPY");
    assert.equal(res.data.status, "planned");
    assert.equal(res.data.favorite, false);
  }));

test("POST without a country returns 400", () =>
  withServer(async (call) => {
    const res = await call("POST", "/api/destinations", { capital: "Nowhere" });
    assert.equal(res.status, 400);
    assert.equal(res.data.message, "Country is required");
  }));

test("POST with invalid JSON returns 400", () =>
  withServer(async (call) => {
    const res = await call("POST", "/api/destinations", "{not json");
    assert.equal(res.status, 400);
    assert.equal(res.data.message, "Invalid JSON body");
  }));

test("GET lists created destinations", () =>
  withServer(async (call) => {
    await call("POST", "/api/destinations", { country: "France" });
    await call("POST", "/api/destinations", { country: "Peru" });
    const res = await call("GET", "/api/destinations");
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.map((d) => d.country), ["France", "Peru"]);
  }));

test("PUT with only favorite or status changes just those fields", () =>
  withServer(async (call) => {
    const { data: created } = await call("POST", "/api/destinations", { country: "Italy", capital: "Rome" });
    const fav = await call("PUT", `/api/destinations/${created.id}`, { favorite: true });
    assert.equal(fav.status, 200);
    assert.equal(fav.data.favorite, true);
    assert.equal(fav.data.capital, "Rome");
    const visited = await call("PUT", `/api/destinations/${created.id}`, { status: "visited" });
    assert.equal(visited.data.status, "visited");
    assert.equal(visited.data.favorite, true);
  }));

test("PUT can clear optional fields but not the country", () =>
  withServer(async (call) => {
    const { data: created } = await call("POST", "/api/destinations", { country: "Chile", note: "hike", days: 4 });
    const cleared = await call("PUT", `/api/destinations/${created.id}`, { note: "", days: "" });
    assert.equal(cleared.data.note, "");
    assert.equal(cleared.data.days, null);
    const bad = await call("PUT", `/api/destinations/${created.id}`, { country: "" });
    assert.equal(bad.status, 400);
  }));

test("PUT on an unknown or malformed id returns 404", () =>
  withServer(async (call) => {
    assert.equal((await call("PUT", "/api/destinations/999", { note: "x" })).status, 404);
    assert.equal((await call("PUT", "/api/destinations/abc", { note: "x" })).status, 404);
  }));

test("DELETE removes a destination and then returns 404", () =>
  withServer(async (call) => {
    const { data: created } = await call("POST", "/api/destinations", { country: "Spain" });
    assert.equal((await call("DELETE", `/api/destinations/${created.id}`)).status, 200);
    assert.equal((await call("DELETE", `/api/destinations/${created.id}`)).status, 404);
    assert.deepEqual((await call("GET", "/api/destinations")).data, []);
  }));

test("POST /reorder saves the manual order the UI sends", () =>
  withServer(async (call) => {
    const a = (await call("POST", "/api/destinations", { country: "A" })).data.id;
    const b = (await call("POST", "/api/destinations", { country: "B" })).data.id;
    const c = (await call("POST", "/api/destinations", { country: "C" })).data.id;
    const res = await call("POST", "/api/destinations/reorder", { ids: [c, a, b] });
    assert.equal(res.status, 200);
    assert.deepEqual((await call("GET", "/api/destinations")).data.map((d) => d.country), ["C", "A", "B"]);
  }));

test("POST /reorder rejects a malformed list", () =>
  withServer(async (call) => {
    assert.equal((await call("POST", "/api/destinations/reorder", { ids: "nope" })).status, 400);
  }));

test("unknown routes return 404 JSON", () =>
  withServer(async (call) => {
    const res = await call("GET", "/api/nothing");
    assert.equal(res.status, 404);
  }));
