import * as permissionService from "../services/permissions.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await permissionService.getAllPermissions(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", permissions);
});

const getPermissionById = catchAsync(async (req, res) => {
  const permissionId = req.params.id;
  const permission = await permissionService.getPermissionById(permissionId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", permission);
});

const createPermission = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const permission = await permissionService.createPermission(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", permission);
});

const updatePermission = catchAsync(async (req, res) => {
  const permissionId = req.params.id;
  const updateRequest = req.body;
  const permission = await permissionService.updatePermission(permissionId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", permission);
});

const deletePermission = catchAsync(async (req, res) => {
  const permissionId = req.params.id;
  await permissionService.deletePermission(permissionId, req.user);
  return res.status(204).end();
});

export { getAllPermissions, getPermissionById, createPermission, updatePermission, deletePermission };
