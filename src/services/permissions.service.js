import * as repository from "../repository/permissions.repository.js";
import { catalogService } from "../utils/catalogService.js";

const service = catalogService({ repository, label: "Permission", fields: ["code", "description"], codePattern: /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/ });
const getAllPermissions = service.getAll;
const getPermissionById = service.getById;
const createPermission = service.create;
const updatePermission = service.update;
const deletePermission = service.delete;

export {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
