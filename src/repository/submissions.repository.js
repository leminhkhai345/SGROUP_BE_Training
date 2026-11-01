import pool from "../config/db.config.js";

const findAll = async ({ sortBy = "id", order = "ASC" } = {}) => {
  const validColumns = ["id", "submitted_at", "score", "status", "created_at", "updated_at"];
  if (!validColumns.includes(sortBy)) {
    throw new Error(`Invalid sortBy column: ${sortBy}`);
  }
  const validOrders = ["asc", "desc"];
  if (typeof order !== "string" || !validOrders.includes(order.toLowerCase())) {
    throw new Error(`Invalid order: ${order}`);
  }
  const result = await pool.query(
    `SELECT * FROM submissions WHERE is_deleted = FALSE ORDER BY ${sortBy} ${order}`
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM submissions WHERE id = $1 AND is_deleted = FALSE",
    [id]
  );
  return result.rows[0] || null;
};

const findByAssignmentId = async (assignmentId) => {
  const result = await pool.query(
    "SELECT * FROM submissions WHERE assignment_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [assignmentId]
  );
  return result.rows;
};

const findByMemberId = async (memberId) => {
  const result = await pool.query(
    "SELECT * FROM submissions WHERE member_id = $1 AND is_deleted = FALSE ORDER BY id ASC",
    [memberId]
  );
  return result.rows;
};

const create = async ({
  assignmentId,
  memberId,
  content,
  repositoryUrl,
  submittedAt,
  score,
  feedback,
  reviewedAt,
  reviewedBy,
  status
}) => {
  const result = await pool.query(
    `INSERT INTO submissions (assignment_id, member_id, content, repository_url, submitted_at, score, feedback, reviewed_at, reviewed_by, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'DRAFT'))
     RETURNING *`,
    [
      assignmentId ?? null,
      memberId ?? null,
      content ?? null,
      repositoryUrl ?? null,
      submittedAt ?? null,
      score ?? null,
      feedback ?? null,
      reviewedAt ?? null,
      reviewedBy ?? null,
      status ?? null
    ]
  );
  return result.rows[0];
};

const update = async ({
  id,
  assignmentId,
  memberId,
  content,
  repositoryUrl,
  submittedAt,
  score,
  feedback,
  reviewedAt,
  reviewedBy,
  status,
  expectedStatus,
  expectedVersion
}, db = pool) => {
  const result = await db.query(
    `UPDATE submissions
     SET assignment_id = COALESCE($1, assignment_id),
         member_id = COALESCE($2, member_id),
         content = COALESCE($3, content),
         repository_url = COALESCE($4, repository_url),
         submitted_at = COALESCE($5, submitted_at),
         score = COALESCE($6, score),
         feedback = COALESCE($7, feedback),
         reviewed_at = COALESCE($8, reviewed_at),
         reviewed_by = COALESCE($9, reviewed_by),
         status = COALESCE($10, status),
         version = version + 1,
         updated_at = NOW()
     WHERE id = $11 AND is_deleted = FALSE AND status = $12 AND version = $13
     RETURNING *`,
    [
      assignmentId ?? null,
      memberId ?? null,
      content ?? null,
      repositoryUrl ?? null,
      submittedAt ?? null,
      score ?? null,
      feedback ?? null,
      reviewedAt ?? null,
      reviewedBy ?? null,
      status ?? null,
      id,
      expectedStatus,
      expectedVersion
    ]
  );
  return result.rows[0] || null;
};

const deleteById = async (id, expectedStatus, expectedVersion) => {
  const result = await pool.query(
    `UPDATE submissions
     SET is_deleted = TRUE, updated_at = NOW(), version = version + 1
     WHERE id = $1 AND is_deleted = FALSE AND status = $2 AND version = $3
     RETURNING *`,
    [id, expectedStatus, expectedVersion]
  );
  return result.rows[0] || null;
};

export { findAll, findById, findByAssignmentId, findByMemberId, create, update, deleteById };
