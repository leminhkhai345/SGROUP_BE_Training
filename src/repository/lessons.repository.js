import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "title", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM lessons WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM lessons WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
};

const findByClassId = async (classId) => {
  const result = await pool.query(
    "SELECT * FROM lessons WHERE class_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [classId]
  );
  return result.rows;
};

const create = async ({ classId, title, content, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO lessons (class_id, title, content, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [classId ?? null, title ?? null, content ?? null, createdBy ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, classId, title, content, createdBy }) => {
  const result = await pool.query(
    `UPDATE lessons
     SET class_id = COALESCE($1, class_id),
         title = COALESCE($2, title),
         content = COALESCE($3, content),
         created_by = COALESCE($4, created_by),
         updated_at = NOW()
     WHERE id = $5 AND is_deleted = FALSE
     RETURNING *`,
    [classId ?? null, title ?? null, content ?? null, createdBy ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE lessons
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByClassId, create, update, deleteById };
