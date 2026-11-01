import pool from "../config/db.config.js";

const findByUser = async (userId, legacyRole) => {
  const result = await pool.query(
    `SELECT r.code, r.is_active, p.code AS permission_code
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE r.code = $2 OR EXISTS (
       SELECT 1 FROM user_roles ur WHERE ur.role_id = r.id AND ur.user_id = $1
       AND ur.assigned_at <= NOW() AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
     )`,
    [userId, legacyRole],
  );
  return result.rows;
};

export { findByUser };
