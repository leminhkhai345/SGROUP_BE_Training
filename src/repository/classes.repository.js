import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "name", "start_date", "end_date", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT id, name, description, start_date, end_date, mentor_id, created_at, updated_at
     FROM classes WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, description, start_date, end_date, mentor_id, created_at, updated_at
     FROM classes WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  );
  return result.rows[0] || null;
};

const findByMentorId = async (mentorId) => {
  const result = await pool.query(
    `SELECT id, name, description, start_date, end_date, mentor_id, created_at, updated_at
     FROM classes WHERE mentor_id = $1 AND is_deleted = FALSE ORDER BY id ASC`,
    [mentorId]
  );
  return result.rows;
};

const create = async ({ name, description, startDate, endDate, mentorId }) => {
  const result = await pool.query(
    `INSERT INTO classes (name, description, start_date, end_date, mentor_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, start_date, end_date, mentor_id, created_at, updated_at`,
    [name, description ?? null, startDate ?? null, endDate ?? null, mentorId ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, name, description, startDate, endDate, mentorId }) => {
  const result = await pool.query(
    `UPDATE classes
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         start_date = COALESCE($3, start_date),
         end_date = COALESCE($4, end_date),
         mentor_id = COALESCE($5, mentor_id),
         updated_at = NOW()
     WHERE id = $6 AND is_deleted = FALSE
     RETURNING id, name, description, start_date, end_date, mentor_id, created_at, updated_at`,
    [name ?? null, description ?? null, startDate ?? null, endDate ?? null, mentorId ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE classes
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING id, name, description, start_date, end_date, mentor_id, created_at, updated_at`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByMentorId, create, update, deleteById };
