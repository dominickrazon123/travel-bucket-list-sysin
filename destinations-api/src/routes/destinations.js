const express = require("express");
const { parseDestination, parseId, parseIds } = require("../validation");

const NOT_FOUND = { message: "Destination not found" };

function destinationsRouter(repo) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    res.json(await repo.list());
  });

  router.post("/reorder", async (req, res) => {
    const ids = parseIds(req.body);
    if (!ids) return res.status(400).json({ message: "ids must be a list of unique destination ids" });
    await repo.reorder(ids);
    res.json({ message: "Order saved" });
  });

  router.post("/", async (req, res) => {
    const { value, error } = parseDestination(req.body);
    if (error) return res.status(400).json({ message: error });
    res.status(201).json(await repo.create(value));
  });

  router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json(NOT_FOUND);
    const { value, error } = parseDestination(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });
    const updated = await repo.update(id, value);
    if (!updated) return res.status(404).json(NOT_FOUND);
    res.json(updated);
  });

  router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    if (!id || !(await repo.remove(id))) return res.status(404).json(NOT_FOUND);
    res.json({ message: "Destination deleted" });
  });

  return router;
}

module.exports = { destinationsRouter };
