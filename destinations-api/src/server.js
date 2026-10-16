const config = require("./config");
const { createPool } = require("./db");
const { createRepository } = require("./repository");
const { createApp } = require("./app");

const pool = createPool();
const app = createApp(createRepository(pool));

const server = app.listen(config.port, () => {
  console.log(`[destinations-api] listening on port ${config.port}`);
});

function shutdown(signal) {
  console.log(`[destinations-api] ${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
