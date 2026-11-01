import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "code", "name", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM roles ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM roles WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
};

const findByCode = async (code) => {
  const result = await pool.query(
    "SELECT * FROM roles WHERE code = $1",
    [code]
  );
  return result.rows[0] || null;
};

const create = async ({ code, name, description, isSystem, isActive }) => {
  const result = await pool.query(
    `INSERT INTO roles (code, name, description, is_system, is_active)
     VALUES ($1, $2, $3, COALESCE($4, FALSE), COALESCE($5, TRUE))
     RETURNING *`,
    [code ?? null, name ?? null, description ?? null, isSystem ?? null, isActive ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, code, name, description, isSystem, isActive }) => {
  const result = await pool.query(
    `UPDATE roles
     SET code = COALESCE($1, code),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         is_system = COALESCE($4, is_system),
         is_active = COALESCE($5, is_active),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [code ?? null, name ?? null, description ?? null, isSystem ?? null, isActive ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `DELETE FROM roles WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByCode, create, update, deleteById };
