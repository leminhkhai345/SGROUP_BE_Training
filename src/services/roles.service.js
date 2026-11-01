import * as repository from "../repository/roles.repository.js";
import { catalogService } from "../utils/catalogService.js";

const service = catalogService({ repository, label: "Role", fields: ["code", "name", "description", "isActive"], codePattern: /^[A-Z][A-Z0-9_]*$/ });
const getAllRoles = service.getAll;
const getRoleById = service.getById;
const createRole = service.create;
const updateRole = service.update;
const deleteRole = service.delete;

export {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
