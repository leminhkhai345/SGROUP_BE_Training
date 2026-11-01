import * as userRoleService from "../services/user_roles.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllUserRoles = catchAsync(async (req, res) => {
  const userRoles = await userRoleService.getAllUserRoles(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", userRoles);
});

const getUserRole = catchAsync(async (req, res) => {
  const { userId, roleId } = req.params;
  const userRole = await userRoleService.getUserRole(userId, roleId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", userRole);
});

const assignRole = catchAsync(async (req, res) => {
  const grantRequest = req.body;
  const userRole = await userRoleService.assignRole(grantRequest, req.user);
  return sendSuccess(res, 201, "Granted successfully", userRole);
});

const updateUserRole = catchAsync(async (req, res) => {
  const { userId, roleId } = req.params;
  const updateRequest = req.body;
  const userRole = await userRoleService.updateUserRole(userId, roleId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", userRole);
});

const revokeRole = catchAsync(async (req, res) => {
  const { userId, roleId } = req.params;
  await userRoleService.revokeRole(userId, roleId, req.user);
  return res.status(204).end();
});

export { getAllUserRoles, getUserRole, assignRole, updateUserRole, revokeRole };
