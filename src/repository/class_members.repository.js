import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "join_at", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM class_members WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM class_members WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
};

const findByClassId = async (classId) => {
  const result = await pool.query(
    "SELECT * FROM class_members WHERE class_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [classId]
  );
  return result.rows;
};

const findByMemberId = async (memberId) => {
  const result = await pool.query(
    "SELECT * FROM class_members WHERE member_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [memberId]
  );
  return result.rows;
};

const findByClassAndMember = async (classId, memberId) => {
  const result = await pool.query(
    "SELECT * FROM class_members WHERE class_id = $1 AND member_id = $2 AND is_deleted = FALSE",
    [classId, memberId]
  );
  return result.rows[0] || null;
};

const create = async ({ classId, memberId, joinAt }) => {
  const result = await pool.query(
    `INSERT INTO class_members (class_id, member_id, join_at)
     VALUES ($1, $2, COALESCE($3, NOW()))
     RETURNING *`,
    [classId ?? null, memberId ?? null, joinAt ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, classId, memberId, joinAt }) => {
  const result = await pool.query(
    `UPDATE class_members
     SET class_id = COALESCE($1, class_id),
         member_id = COALESCE($2, member_id),
         join_at = COALESCE($3, join_at),
         updated_at = NOW()
     WHERE id = $4 AND is_deleted = FALSE
     RETURNING *`,
    [classId ?? null, memberId ?? null, joinAt ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE class_members
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByClassId, findByMemberId, findByClassAndMember, create, update, deleteById };
