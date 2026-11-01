import pool from "../config/db.config.js";

const findAll = async () => {
  const result = await pool.query("SELECT * FROM user_roles ORDER BY user_id ASC, role_id ASC");
  return result.rows;
};

const findByUserId = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM user_roles WHERE user_id = $1 ORDER BY role_id ASC",
    [userId]
  );
  return result.rows;
};

const findByRoleId = async (roleId) => {
  const result = await pool.query(
    "SELECT * FROM user_roles WHERE role_id = $1 ORDER BY user_id ASC",
    [roleId]
  );
  return result.rows;
};

const findByUserAndRole = async (userId, roleId) => {
  const result = await pool.query(
    "SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2",
    [userId, roleId]
  );
  return result.rows[0] || null;
};

const create = async ({ userId, roleId, assignedBy, assignedAt, expiresAt }) => {
  const result = await pool.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at, expires_at)
     VALUES ($1, $2, $3, COALESCE($4, NOW()), $5)
     RETURNING *`,
    [userId, roleId, assignedBy ?? null, assignedAt ?? null, expiresAt ?? null]
  );
  return result.rows[0];
};

const update = async ({ userId, roleId, assignedBy, assignedAt, expiresAt }) => {
  const result = await pool.query(
    `UPDATE user_roles
     SET assigned_by = COALESCE($1, assigned_by),
         assigned_at = COALESCE($2, assigned_at),
         expires_at = CASE WHEN $4 THEN $3 ELSE expires_at END
     WHERE user_id = $5 AND role_id = $6
     RETURNING *`,
    [assignedBy ?? null, assignedAt ?? null, expiresAt ?? null, expiresAt !== undefined, userId, roleId]
  );
  return result.rows[0] || null;
};

const deleteByUserAndRole = async (userId, roleId) => {
  const result = await pool.query(
    `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2
     RETURNING *`,
    [userId, roleId]
  );
  return result.rows[0] || null;
};

export { findAll, findByUserId, findByRoleId, findByUserAndRole, create, update, deleteByUserAndRole };
