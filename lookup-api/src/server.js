const config = require("./config");
const { createLookupService } = require("./lookupService");
const { createApp } = require("./app");

const app = createApp(createLookupService(config));

const server = app.listen(config.port, () => {
  console.log(`[lookup-api] listening on port ${config.port} (${config.apiKey ? "v5 with key" : "legacy v3.1 without key"})`);
});

function shutdown(signal) {
  console.log(`[lookup-api] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
