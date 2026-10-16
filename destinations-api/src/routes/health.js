const express = require("express");

function healthRouter(repo) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      await repo.ping();
      res.json({ status: "ok", service: "destinations-api", database: "up" });
    } catch (err) {
      console.error("[health] database check failed:", err.message);
      res.status(503).json({ status: "error", service: "destinations-api", database: "down" });
    }
  });

  return router;
}

module.exports = { healthRouter };
