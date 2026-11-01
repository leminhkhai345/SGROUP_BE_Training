import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ConflictError } from "../core/error.response.js";
import * as repository from "../repository/role_permissions.repository.js";
import * as roles from "../repository/roles.repository.js";
import * as permissions from "../repository/permissions.repository.js";
import { requirePermission } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, dateField } from "../utils/serviceHelper.js";

const identity = (roleId, permissionId) => { validateId(roleId, "roleId"); validateId(permissionId, "permissionId"); };
const getAllRolePermissions = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "rbac:manage");
  return findPage("role_permissions", options, actor);
});

const getRolePermission = serviceAction(async (roleId, permissionId, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(roleId, permissionId);
  return requireRecord(await repository.findByRoleAndPermission(roleId, permissionId), "Role permission");
});

const grantPermission = serviceAction(async (body, actor) => {
  requirePermission(actor, "rbac:manage");
  validateBody(body);
  identity(body.roleId, body.permissionId);
  requireRecord(await roles.findById(body.roleId), "Role");
  requireRecord(await permissions.findById(body.permissionId), "Permission");
  if (await repository.findByRoleAndPermission(body.roleId, body.permissionId)) throw new ConflictError("Permission is already granted to this role");
  return repository.create({ roleId: body.roleId, permissionId: body.permissionId });
});

const updateRolePermission = serviceAction(async (roleId, permissionId, body, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(roleId, permissionId);
  validateBody(body);
  requireRecord(await repository.findByRoleAndPermission(roleId, permissionId), "Role permission");
  if (body.grantedAt === undefined) throw new BadRequestError("grantedAt is required");
  dateField(body.grantedAt, "grantedAt");
  return requireRecord(await repository.update({ roleId, permissionId, grantedAt: body.grantedAt }), "Role permission");
});

const revokePermission = serviceAction(async (roleId, permissionId, actor) => {
  requirePermission(actor, "rbac:manage");
  identity(roleId, permissionId);
  return requireRecord(await repository.deleteByRoleAndPermission(roleId, permissionId), "Role permission");
});

export {
  getAllRolePermissions,
  getRolePermission,
  grantPermission,
  updateRolePermission,
  revokePermission,
};
