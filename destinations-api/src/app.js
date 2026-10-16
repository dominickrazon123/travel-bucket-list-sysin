const express = require("express");
const { healthRouter } = require("./routes/health");
const { destinationsRouter } = require("./routes/destinations");

function createApp(repo) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.use("/health", healthRouter(repo));
  app.use("/api/destinations", destinationsRouter(repo));

  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ message: "Invalid JSON body" });
    }
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("[destinations-api] unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
