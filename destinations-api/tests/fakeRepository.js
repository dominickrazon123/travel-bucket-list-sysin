function createFakeRepository() {
  let rows = [];
  let nextId = 1;
  const state = { healthy: true };

  const defaults = () => ({
    capital: "", note: "", region: "", population: "", languages: "", currencies: "",
    currencyCode: "", date: null, days: null, tier: "mid", status: "planned", favorite: false,
  });

  return {
    state,
    async ping() {
      if (!state.healthy) throw new Error("db down");
    },
    async list() {
      return rows.map((r) => ({ ...r }));
    },
    async get(id) {
      const row = rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },
    async create(fields) {
      const row = { id: nextId++, ...defaults(), ...fields };
      rows.push(row);
      return { ...row };
    },
    async update(id, fields) {
      const row = rows.find((r) => r.id === id);
      if (!row) return null;
      Object.assign(row, fields);
      return { ...row };
    },
    async remove(id) {
      const before = rows.length;
      rows = rows.filter((r) => r.id !== id);
      return rows.length < before;
    },
    async reorder(ids) {
      const rank = new Map(ids.map((id, i) => [id, i]));
      rows.sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 1e9) - (rank.has(b.id) ? rank.get(b.id) : 1e9));
    },
  };
}

module.exports = { createFakeRepository };
