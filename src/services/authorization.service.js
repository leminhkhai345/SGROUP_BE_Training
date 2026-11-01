import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";
import * as users from "../repository/users.repository.js";
import * as access from "../repository/access.repository.js";
import * as classes from "../repository/classes.repository.js";
import * as members from "../repository/class_members.repository.js";
import { serviceAction, requireRecord, validateId } from "../utils/serviceHelper.js";
import { isAdmin, sameId, hasPermission } from "../utils/accessHelper.js";

const DEFAULT_PERMISSIONS = {
  ADMIN: ["*"],
  MENTOR: ["classes:read", "classes:write", "classes:members", "lessons:read", "lessons:write", "assignments:read", "assignments:write", "submissions:read", "submissions:review", "progress:read", "uploads:write"],
  MEMBER: ["classes:read", "lessons:read", "assignments:read", "submissions:read", "submissions:write", "progress:read", "progress:write", "uploads:write"],
};

const getUserAccess = serviceAction(async (userId) => {
  validateId(userId, "userId");
  const user = await users.findById(userId);
  if (!user) throw new UnauthorizedError("Account no longer exists");
  const entries = await access.findByUser(user.id, user.role);
  const roles = new Set();
  const permissions = new Set();
  for (const entry of entries) {
    if (entry.is_active !== true) continue;
    roles.add(entry.code);
    if (entry.permission_code) permissions.add(entry.permission_code);
  }
  // Existing users.role keeps working before the RBAC catalogue is seeded.
  // Once that role exists in roles, its active flag and grants are authoritative.
  if (user.role && !entries.some((entry) => entry.code === user.role)) {
    roles.add(user.role);
    for (const permission of DEFAULT_PERMISSIONS[user.role] ?? []) permissions.add(permission);
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

const canReadClass = async (actor, classroom) => isAdmin(actor) || sameId(classroom.mentor_id, actor.id) || Boolean(await members.findByClassAndMember(classroom.id, actor.id));

const requireClassAccess = async (actor, classId, manage = false) => {
  requireActor(actor);
  validateId(classId, "classId");
  const classroom = requireRecord(await classes.findById(classId), "Class");
  const allowed = manage ? isAdmin(actor) || sameId(classroom.mentor_id, actor.id) : await canReadClass(actor, classroom);
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
  DEFAULT_PERMISSIONS,
  getUserAccess,
  requireActor,
  requirePermission,
  requireAdmin,
  canReadClass,
  requireClassAccess,
  filterClassRecords,
};
