import * as roleService from "../services/roles.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", roles);
});

const getRoleById = catchAsync(async (req, res) => {
  const roleId = req.params.id;
  const role = await roleService.getRoleById(roleId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", role);
});

const createRole = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const role = await roleService.createRole(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", role);
});

const updateRole = catchAsync(async (req, res) => {
  const roleId = req.params.id;
  const updateRequest = req.body;
  const role = await roleService.updateRole(roleId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", role);
});

const deleteRole = catchAsync(async (req, res) => {
  const roleId = req.params.id;
  await roleService.deleteRole(roleId, req.user);
  return res.status(204).end();
});

export { getAllRoles, getRoleById, createRole, updateRole, deleteRole };
