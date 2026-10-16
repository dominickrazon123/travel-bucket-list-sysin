const express = require("express");
const { UpstreamError } = require("./lookupService");

function createApp(service) {
  const app = express();
  app.disable("x-powered-by");

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "lookup-api" });
  });

  app.get("/api/lookup", async (req, res) => {
    const query = String(req.query.country || req.query.q || "").trim();
    if (!query) return res.json([]);
    try {
      res.json(await service.search(query));
    } catch (err) {
      if (err instanceof UpstreamError) {
        console.error("[lookup-api] upstream error:", err.message);
        return res.status(err.status).json({ message: err.message });
      }
      console.error("[lookup-api] request failed:", err.cause || err.message);
      res.status(500).json({ message: "Could not reach the country API. Check the server's internet connection." });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  return app;
}

module.exports = { createApp };
