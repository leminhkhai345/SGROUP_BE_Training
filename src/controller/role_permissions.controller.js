import * as rolePermissionService from "../services/role_permissions.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllRolePermissions = catchAsync(async (req, res) => {
  const rolePermissions = await rolePermissionService.getAllRolePermissions(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", rolePermissions);
});

const getRolePermission = catchAsync(async (req, res) => {
  const { roleId, permissionId } = req.params;
  const rolePermission = await rolePermissionService.getRolePermission(roleId, permissionId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", rolePermission);
});

const grantPermission = catchAsync(async (req, res) => {
  const grantRequest = req.body;
  const rolePermission = await rolePermissionService.grantPermission(grantRequest, req.user);
  return sendSuccess(res, 201, "Granted successfully", rolePermission);
});

const updateRolePermission = catchAsync(async (req, res) => {
  const { roleId, permissionId } = req.params;
  const updateRequest = req.body;
  const rolePermission = await rolePermissionService.updateRolePermission(roleId, permissionId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", rolePermission);
});

const revokePermission = catchAsync(async (req, res) => {
  const { roleId, permissionId } = req.params;
  await rolePermissionService.revokePermission(roleId, permissionId, req.user);
  return res.status(204).end();
});

export { getAllRolePermissions, getRolePermission, grantPermission, updateRolePermission, revokePermission };
