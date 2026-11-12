import pool from "../config/db.config.js";

const findByUser = async (userId) => {
  const result = await pool.query(
    `SELECT r.code, r.is_active, p.code AS permission_code
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE EXISTS (
       SELECT 1 FROM user_roles ur WHERE ur.role_id = r.id AND ur.user_id = $1
       AND ur.assigned_at <= NOW() AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
     )
     ORDER BY r.code, p.code`,
    [userId],
  );
  return result.rows;
};

export { findByUser };
