import pool from "../config/db.config.js";

const findAll = async () => {
  const result = await pool.query("SELECT * FROM role_permissions ORDER BY role_id ASC, permission_id ASC");
  return result.rows;
};

const findByRoleId = async (roleId) => {
  const result = await pool.query(
    "SELECT * FROM role_permissions WHERE role_id = $1 ORDER BY permission_id ASC",
    [roleId]
  );
  return result.rows;
};

const findByPermissionId = async (permissionId) => {
  const result = await pool.query(
    "SELECT * FROM role_permissions WHERE permission_id = $1 ORDER BY role_id ASC",
    [permissionId]
  );
  return result.rows;
};

const findByRoleAndPermission = async (roleId, permissionId) => {
  const result = await pool.query(
    "SELECT * FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
    [roleId, permissionId]
  );
  return result.rows[0] || null;
};

const create = async ({ roleId, permissionId, grantedAt }) => {
  const result = await pool.query(
    `INSERT INTO role_permissions (role_id, permission_id, granted_at)
     VALUES ($1, $2, COALESCE($3, NOW()))
     RETURNING *`,
    [roleId, permissionId, grantedAt ?? null]
  );
  return result.rows[0];
};

const update = async ({ roleId, permissionId, grantedAt }) => {
  const result = await pool.query(
    `UPDATE role_permissions
     SET granted_at = COALESCE($1, granted_at)
     WHERE role_id = $2 AND permission_id = $3
     RETURNING *`,
    [grantedAt ?? null, roleId, permissionId]
  );
  return result.rows[0] || null;
};

const deleteByRoleAndPermission = async (roleId, permissionId) => {
  const result = await pool.query(
    `DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2
     RETURNING *`,
    [roleId, permissionId]
  );
  return result.rows[0] || null;
};

export { findAll, findByRoleId, findByPermissionId, findByRoleAndPermission, create, update, deleteByRoleAndPermission };
