import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "title", "deadline", "maximum_score", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM assignments WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM assignments WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
};

const findByClassId = async (classId) => {
  const result = await pool.query(
    "SELECT * FROM assignments WHERE class_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [classId]
  );
  return result.rows;
};

const findByCreatedBy = async (createdBy) => {
  const result = await pool.query(
    "SELECT * FROM assignments WHERE created_by = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [createdBy]
  );
  return result.rows;
};

const create = async ({ classId, title, description, deadline, maximumScore, createdBy, imageUrl }) => {
  const result = await pool.query(
    `INSERT INTO assignments (class_id, title, description, deadline, maximum_score, created_by, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [classId ?? null, title ?? null, description ?? null, deadline ?? null, maximumScore ?? null, createdBy ?? null, imageUrl ?? null]
  );
  return result.rows[0];
};

const update = async ({ id, classId, title, description, deadline, maximumScore, createdBy, imageUrl }, db = pool) => {
  const result = await db.query(
    `UPDATE assignments
     SET class_id = COALESCE($1, class_id),
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         deadline = COALESCE($4, deadline),
         maximum_score = COALESCE($5, maximum_score),
         created_by = COALESCE($6, created_by),
         image_url = COALESCE($7, image_url),
         updated_at = NOW()
     WHERE id = $8 AND is_deleted = FALSE
     RETURNING *`,
    [classId ?? null, title ?? null, description ?? null, deadline ?? null, maximumScore ?? null, createdBy ?? null, imageUrl ?? null, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    `UPDATE assignments
     SET is_deleted = TRUE, updated_at = NOW()
     WHERE id = $1 AND is_deleted = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

// Assignment edits and reviews lock the same parent row before checking scores.
const findByIdForUpdate = async (id, db) => {
  const result = await db.query("SELECT * FROM assignments WHERE id = $1 AND is_deleted = FALSE FOR UPDATE", [id]);
  return result.rows[0] ?? null;
};

const hasScoreAbove = async (id, maximumScore, db) => {
  const result = await db.query("SELECT 1 FROM submissions WHERE assignment_id = $1 AND is_deleted = FALSE AND score > $2 LIMIT 1", [id, maximumScore]);
  return result.rows.length > 0;
};

export {
  findAll,
  findById,
  findByClassId,
  findByCreatedBy,
  create,
  update,
  deleteById,
  findByIdForUpdate,
  hasScoreAbove,
};
