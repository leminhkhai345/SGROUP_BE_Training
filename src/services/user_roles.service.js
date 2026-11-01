import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ConflictError } from "../core/error.response.js";
import * as repository from "../repository/user_roles.repository.js";
import * as users from "../repository/users.repository.js";
import * as roles from "../repository/roles.repository.js";
import { requirePermission } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, dateField } from "../utils/serviceHelper.js";

const identity = (userId, roleId) => { validateId(userId, "userId"); validateId(roleId, "roleId"); };
const expiry = (expiresAt) => {
  if (expiresAt === null || expiresAt === undefined) return;
  dateField(expiresAt, "expiresAt");
  if (new Date(expiresAt) <= new Date()) throw new BadRequestError("expiresAt must be in the future");
};
const getAllUserRoles = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "rbac:manage");
  return findPage("user_roles", options, actor);
});

const getUserRole = serviceAction(async (userId, roleId, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(userId, roleId);
  return requireRecord(await repository.findByUserAndRole(userId, roleId), "User role");
});

const assignRole = serviceAction(async (body, actor) => {
  requirePermission(actor, "rbac:manage");
  validateBody(body);
  identity(body.userId, body.roleId);
  requireRecord(await users.findById(body.userId), "User");
  const role = requireRecord(await roles.findById(body.roleId), "Role");
  if (!role.is_active) throw new BadRequestError("Cannot assign an inactive role");
  expiry(body.expiresAt);
  if (await repository.findByUserAndRole(body.userId, body.roleId)) throw new ConflictError("Role is already assigned to this user");
  return repository.create({ userId: body.userId, roleId: body.roleId, expiresAt: body.expiresAt, assignedBy: actor.id });
});

const updateUserRole = serviceAction(async (userId, roleId, body, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(userId, roleId);
  validateBody(body);
  requireRecord(await repository.findByUserAndRole(userId, roleId), "User role");
  if (body.expiresAt === undefined) throw new BadRequestError("expiresAt is required; use null for no expiry");
  expiry(body.expiresAt);
  return requireRecord(await repository.update({ userId, roleId, expiresAt: body.expiresAt, assignedBy: actor.id }), "User role");
});

const revokeRole = serviceAction(async (userId, roleId, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(userId, roleId);
  return requireRecord(await repository.deleteByUserAndRole(userId, roleId), "User role");
});

export {
  getAllUserRoles,
  getUserRole,
  assignRole,
  updateUserRole,
  revokeRole,
};
