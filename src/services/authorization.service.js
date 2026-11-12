import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";
import * as users from "../repository/users.repository.js";
import * as access from "../repository/access.repository.js";
import * as classes from "../repository/classes.repository.js";
import * as members from "../repository/class_members.repository.js";
import { serviceAction, requireRecord, validateId } from "../utils/serviceHelper.js";
import { isAdmin, sameId, hasPermission } from "../utils/accessHelper.js";

const PERMISSION_ALIASES = {
  "users:read": ["users:read", "user.manage"],
  "users:write": ["users:write", "user.manage"],
  "classes:read": ["classes:read", "class.read.assigned", "class.read.enrolled"],
  "classes:write": ["classes:write", "class.manage", "class.update.assigned"],
  "classes:members": ["classes:members", "class_member.manage.assigned"],
  "lessons:read": ["lessons:read", "lesson.read.enrolled"],
  "lessons:write": ["lessons:write", "lesson.manage", "lesson.manage.assigned"],
  "assignments:read": ["assignments:read", "assignment.read.enrolled"],
  "assignments:write": ["assignments:write", "assignment.manage", "assignment.manage.assigned"],
  "submissions:read": ["submissions:read", "submission.read.assigned"],
  "submissions:write": ["submissions:write", "submission.manage.self"],
  "submissions:review": ["submissions:review", "submission.grade.assigned"],
  "progress:read": ["progress:read", "lesson_progress.read.assigned"],
  "progress:write": ["progress:write", "lesson_progress.update.self"],
  "rbac:manage": ["rbac:manage", "rbac.manage"],
};

const getUserAccess = serviceAction(async (userId) => {
  validateId(userId, "userId");
  const user = await users.findById(userId);
  if (!user) throw new UnauthorizedError("Account no longer exists");
  const entries = await access.findByUser(user.id);
  const roles = new Set();
  const permissions = new Set();
  for (const entry of entries) {
    if (entry.is_active !== true) continue;
    roles.add(entry.code);
    if (entry.permission_code) permissions.add(entry.permission_code);
  }
  const grantedCodes = [...permissions];
  for (const [apiPermission, codes] of Object.entries(PERMISSION_ALIASES)) {
    if (codes.some((code) => grantedCodes.includes(code))) permissions.add(apiPermission);
  }
  if ((await classes.findByMentorId(user.id)).length > 0) {
    for (const permission of ["classes:read", "classes:write", "classes:members", "lessons:read", "lessons:write", "assignments:read", "assignments:write", "submissions:read", "submissions:review", "progress:read"]) {
      permissions.add(permission);
    }
  }
  return { ...user, roles: [...roles], permissions: [...permissions] };
});

const requireActor = (actor) => {
  if (!actor?.id) throw new UnauthorizedError("Authentication required");
};
const requirePermission = (actor, permission) => {
  requireActor(actor);
  if (!hasPermission(actor, permission)) throw new ForbiddenError("Insufficient permissions");
};
const requireAdmin = (actor) => {
  requireActor(actor);
  if (!isAdmin(actor)) throw new ForbiddenError("Administrator access required");
};

const canReadClass = async (actor, classroom) => isAdmin(actor) || hasPermission(actor, "classes:read") && (sameId(classroom.mentor_id, actor.id) || Boolean(await members.findByClassAndMember(classroom.id, actor.id)));

const requireClassAccess = async (actor, classId, manage = false) => {
  requireActor(actor);
  validateId(classId, "classId");
  const classroom = requireRecord(await classes.findById(classId), "Class");
  const allowed = manage ? isAdmin(actor) || hasPermission(actor, "classes:write") && sameId(classroom.mentor_id, actor.id) : await canReadClass(actor, classroom);
  if (!allowed) throw new ForbiddenError("You do not have access to this class");
  return classroom;
};

const filterClassRecords = async (actor, records) => {
  requireActor(actor);
  const accessByClass = new Map();
  for (const record of records) {
    if (!accessByClass.has(String(record.class_id))) {
      const classroom = await classes.findById(record.class_id);
      accessByClass.set(String(record.class_id), Boolean(classroom && await canReadClass(actor, classroom)));
    }
  }
  return records.filter((record) => accessByClass.get(String(record.class_id)));
};

export {
  isAdmin,
  sameId,
  hasPermission,
  getUserAccess,
  requireActor,
  requirePermission,
  requireAdmin,
  canReadClass,
  requireClassAccess,
  filterClassRecords,
};
