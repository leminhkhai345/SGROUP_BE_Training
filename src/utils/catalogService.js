import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/error.response.js";
import { requirePermission } from "../services/authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, pick, textField } from "./serviceHelper.js";

const catalogService = ({ repository, label, fields, codePattern }) => {
  const prepare = async (body, existing) => {
    validateBody(body);
    const data = pick(body, fields);
    if (!Object.keys(data).length) throw new BadRequestError("No catalogue fields supplied");
    data.code = textField(data.code, "code", !existing);
    if (data.code !== undefined) {
      if (!codePattern.test(data.code)) throw new BadRequestError("Invalid code format");
      const duplicate = await repository.findByCode(data.code);
      if (duplicate && !sameId(duplicate.id, existing?.id)) throw new ConflictError(`${label} code already exists`);
    }
    if (fields.includes("name")) data.name = textField(data.name, "name", !existing);
    if (data.description !== undefined && typeof data.description !== "string") throw new BadRequestError("description must be a string");
    if (data.isActive !== undefined && typeof data.isActive !== "boolean") throw new BadRequestError("isActive must be boolean");
    if (body.isSystem !== undefined) throw new ForbiddenError("System role flag is managed by the application");
    if ((existing?.is_system || (label === "Role" && ["ADMIN", "MENTOR", "MEMBER"].includes(existing?.code))) && data.code !== undefined && data.code !== existing.code) throw new ForbiddenError("System role code cannot be changed");
    return data;
  };
  const load = async (id) => {
    validateId(id);
    return requireRecord(await repository.findById(id), label);
  };
  return {
    getAll: serviceAction(async (options = {}, actor) => {
      requirePermission(actor, "rbac:manage");
      return findPage(label === "Role" ? "roles" : "permissions", options, actor);
    }),
    getById: serviceAction(async (id, actor) => {
      requirePermission(actor, "rbac:manage");
      return load(id);
    }),
    create: serviceAction(async (body, actor) => {
      requirePermission(actor, "rbac:manage");
      return repository.create(await prepare(body));
    }),
    update: serviceAction(async (id, body, actor) => {
      requirePermission(actor, "rbac:manage");
      const existing = await load(id);
      return requireRecord(await repository.update({ ...await prepare(body, existing), id }), label);
    }),
    delete: serviceAction(async (id, actor) => {
      requirePermission(actor, "rbac:manage");
      const record = await load(id);
      if (record.is_system || (label === "Role" && ["ADMIN", "MENTOR", "MEMBER"].includes(record.code))) throw new ForbiddenError("System roles cannot be deleted");
      return requireRecord(await repository.deleteById(id), label);
    }),
  };
};

export { catalogService };
const sameId = (left, right) => left != null && right != null && String(left) === String(right);
