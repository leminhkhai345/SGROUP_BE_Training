import pool from "../config/db.config.js";
import { pagination, sorting, validateId } from "../utils/serviceHelper.js";
import { hasPermission, isAdmin } from "../utils/accessHelper.js";

const resources = {
  users: { columns: ["id", "name", "email", "created_at"], select: "r.id, r.name, r.email, r.role, r.phone, r.dob, r.avt_url" },
  classes: { columns: ["id", "name", "start_date", "end_date", "created_at", "updated_at"], scope: "class" },
  class_members: { columns: ["id", "join_at", "created_at", "updated_at"], scope: "class", filters: { classId: "class_id" } },
  lessons: { columns: ["id", "title", "created_at", "updated_at"], scope: "class", filters: { classId: "class_id" } },
  assignments: { columns: ["id", "title", "deadline", "maximum_score", "created_at", "updated_at"], scope: "class", filters: { classId: "class_id" } },
  submissions: { columns: ["id", "submitted_at", "score", "status", "created_at", "updated_at"], scope: "submission", filters: { assignmentId: "assignment_id", memberId: "member_id" } },
  lesson_progress: { columns: ["id", "completed_at", "created_at", "updated_at"], scope: "progress", filters: { lessonId: "lesson_id", memberId: "member_id" } },
  roles: { columns: ["id", "code", "name", "created_at", "updated_at"], catalogue: true },
  permissions: { columns: ["id", "code", "created_at", "updated_at"], catalogue: true },
  user_roles: { columns: ["user_id", "role_id", "assigned_at", "expires_at"], catalogue: true, filters: { userId: "user_id", roleId: "role_id" }, keys: ["user_id", "role_id"] },
  role_permissions: { columns: ["role_id", "permission_id", "granted_at"], catalogue: true, filters: { roleId: "role_id", permissionId: "permission_id" }, keys: ["role_id", "permission_id"] },
};

// Identifiers come exclusively from the catalogue above; request values are parameters.
const findPage = async (resource, options = {}, actor) => {
  const definition = resources[resource];
  if (!definition) throw new Error("Unknown list resource");
  const { limit, offset } = pagination(options);
  const { sortBy, order } = sorting({ ...options, sortBy: options.sortBy ?? definition.keys?.[0] ?? "id" }, definition.columns);
  const params = [];
  const bind = (value) => { params.push(value); return `$${params.length}`; };
  const where = definition.catalogue ? [] : ["r.is_deleted = FALSE"];
  let joins = "";
  let classroom = "c";
  if (resource === "classes") classroom = "r";
  else if (definition.scope === "class") joins = " JOIN classes c ON c.id = r.class_id AND c.is_deleted = FALSE";
  else if (definition.scope === "submission") joins = " JOIN assignments a ON a.id = r.assignment_id AND a.is_deleted = FALSE JOIN classes c ON c.id = a.class_id AND c.is_deleted = FALSE";
  else if (definition.scope === "progress") joins = " JOIN lessons l ON l.id = r.lesson_id AND l.is_deleted = FALSE JOIN classes c ON c.id = l.class_id AND c.is_deleted = FALSE";

  if (definition.scope && !isAdmin(actor)) {
    const user = bind(actor.id);
    where.push(`(${classroom}.mentor_id = ${user} OR EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = ${classroom}.id AND cm.member_id = ${user} AND cm.is_deleted = FALSE))`);
    if (["submission", "progress"].includes(definition.scope)) {
      const mentorCanRead = definition.scope === "progress" || hasPermission(actor, "submissions:review");
      where.push(mentorCanRead ? `(r.member_id = ${user} OR ${classroom}.mentor_id = ${user})` : `r.member_id = ${user}`);
    }
  }
  for (const [field, column] of Object.entries(definition.filters ?? {})) {
    if (options[field] !== undefined) {
      validateId(options[field], field);
      where.push(`r.${column} = ${bind(options[field])}`);
    }
  }
  const keys = definition.keys ?? ["id"];
  const orderBy = [`r.${sortBy} ${order}`, ...keys.filter((key) => key !== sortBy).map((key) => `r.${key} ASC`)];
  const result = await pool.query(
    `SELECT ${definition.select ?? "r.*"} FROM ${resource} r${joins}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY ${orderBy.join(", ")} LIMIT ${bind(limit)} OFFSET ${bind(offset)}`,
    params,
  );
  return result.rows;
};

export { findPage };
