const base = `http://127.0.0.1:${process.env.PORT || 3000}`;

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function expect(label, condition) {
  if (!condition) throw new Error(`FAILED: ${label}`);
  console.log(`ok - ${label}`);
}

async function main() {
  const health = await call("GET", "/health");
  expect("health endpoint reports database up", health.status === 200 && health.data.database === "up");

  const created = await call("POST", "/api/destinations", { country: "Smoke Test Land", capital: "Checkville", tier: "low", days: "5" });
  expect("create writes a row to PostgreSQL", created.status === 201 && created.data.id > 0 && created.data.days === 5);
  const id = created.data.id;

  try {
    const list = await call("GET", "/api/destinations");
    expect("list reads the row back", list.status === 200 && list.data.some((d) => d.id === id));

    const updated = await call("PUT", `/api/destinations/${id}`, { favorite: true, status: "visited" });
    expect("update persists favorite and status", updated.status === 200 && updated.data.favorite === true && updated.data.status === "visited");
  } finally {
    const removed = await call("DELETE", `/api/destinations/${id}`);
    expect("delete removes the smoke row", removed.status === 200);
  }

  const after = await call("GET", "/api/destinations");
  expect("smoke row is gone", !after.data.some((d) => d.id === id));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
