const COLUMNS = `
  id, country, capital, note, region, population, languages, currencies,
  currency_code AS "currencyCode",
  to_char(visit_date, 'YYYY-MM-DD') AS "date",
  days, tier, status, favorite
`;

const WRITABLE = {
  country: "country",
  capital: "capital",
  note: "note",
  region: "region",
  population: "population",
  languages: "languages",
  currencies: "currencies",
  currencyCode: "currency_code",
  date: "visit_date",
  days: "days",
  tier: "tier",
  status: "status",
  favorite: "favorite",
};

function createRepository(pool) {
  return {
    async ping() {
      await pool.query("SELECT 1");
    },

    async list() {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM destinations ORDER BY position, id`);
      return rows;
    },

    async get(id) {
      const { rows } = await pool.query(`SELECT ${COLUMNS} FROM destinations WHERE id = $1`, [id]);
      return rows[0] || null;
    },

    async create(fields) {
      const names = Object.keys(fields).filter((f) => WRITABLE[f]);
      const columns = names.map((f) => WRITABLE[f]);
      const params = names.map((f) => fields[f]);
      const placeholders = names.map((_, i) => `$${i + 1}`);
      const sql = `
        INSERT INTO destinations (${[...columns, "position"].join(", ")})
        VALUES (${[...placeholders, "(SELECT COALESCE(MAX(position), 0) + 1 FROM destinations)"].join(", ")})
        RETURNING ${COLUMNS}`;
      const { rows } = await pool.query(sql, params);
      return rows[0];
    },

    async update(id, fields) {
      const names = Object.keys(fields).filter((f) => WRITABLE[f]);
      if (names.length === 0) return this.get(id);
      const assignments = names.map((f, i) => `${WRITABLE[f]} = $${i + 1}`);
      const params = [...names.map((f) => fields[f]), id];
      const sql = `
        UPDATE destinations
        SET ${assignments.join(", ")}, updated_at = now()
        WHERE id = $${params.length}
        RETURNING ${COLUMNS}`;
      const { rows } = await pool.query(sql, params);
      return rows[0] || null;
    },

    async remove(id) {
      const { rowCount } = await pool.query("DELETE FROM destinations WHERE id = $1", [id]);
      return rowCount > 0;
    },

    async reorder(ids) {
      await pool.query(
        `UPDATE destinations d
         SET position = o.ord
         FROM unnest($1::int[]) WITH ORDINALITY AS o(id, ord)
         WHERE d.id = o.id`,
        [ids]
      );
    },
  };
}

module.exports = { createRepository };
