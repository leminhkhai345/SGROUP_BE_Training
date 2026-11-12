import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "completed_at", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM lesson_progress WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM lesson_progress WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
};

const findByLessonId = async (lessonId) => {
  const result = await pool.query(
    "SELECT * FROM lesson_progress WHERE lesson_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [lessonId]
  );
  return result.rows;
};

const findByMemberId = async (memberId) => {
  const result = await pool.query(
    "SELECT * FROM lesson_progress WHERE member_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [memberId]
  );
  return result.rows;
};

const findByLessonAndMember = async (lessonId, memberId) => {
  const result = await pool.query(
    "SELECT * FROM lesson_progress WHERE lesson_id = $1 AND member_id = $2 AND is_deleted = FALSE",
    [lessonId, memberId]
  );
  return result.rows[0] || null;
};

const create = async ({ lessonId, memberId, completedAt }) => {
  const result = await pool.query(
    `INSERT INTO lesson_progress (lesson_id, member_id, completed_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [lessonId ?? null, memberId ?? null, completedAt ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, completedAt }) => {
  const result = await pool.query(
    `UPDATE lesson_progress
     SET completed_at = $1,
         updated_at = NOW()
     WHERE id = $2 AND is_deleted = FALSE
     RETURNING *`,
    [completedAt ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE lesson_progress
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByLessonId, findByMemberId, findByLessonAndMember, create, update, deleteById };
