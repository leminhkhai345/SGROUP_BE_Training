import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "code", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM permissions ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM permissions WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const findByCode = async (code) => {
  const result = await pool.query(
    "SELECT * FROM permissions WHERE code = $1",
    [code]
  );
  return result.rows[0] || null;
};

const create = async ({ code, description }) => {
  const result = await pool.query(
    `INSERT INTO permissions (code, description)
     VALUES ($1, $2)
     RETURNING *`,
    [code ?? null, description ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, code, description }) => {
  const result = await pool.query(
    `UPDATE permissions
     SET code = COALESCE($1, code),
         description = COALESCE($2, description),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [code ?? null, description ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `DELETE FROM permissions WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByCode, create, update, deleteById };
