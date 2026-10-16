const { Pool } = require("pg");
const config = require("./config");

function createPool() {
  const pool = new Pool({ ...config.db, max: 10, idleTimeoutMillis: 30000 });
  pool.on("error", (err) => console.error("[db] idle client error:", err.message));
  return pool;
}

module.exports = { createPool };
