import { findPage } from "../repository/list.repository.js";
import { BadRequestError } from "../core/error.response.js";
import { requirePermission, requireClassAccess } from "../services/authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody } from "./serviceHelper.js";

// Lessons and assignments share class ownership rules and CRUD flow.
const classResourceService = ({ repository, resource, label, prepare }) => {
  const load = async (id) => {
    validateId(id);
    return requireRecord(await repository.findById(id), label);
  };
  return {
    getAll: serviceAction(async (options = {}, actor) => {
      requirePermission(actor, `${resource}:read`);
      if (options.classId !== undefined) {
        await requireClassAccess(actor, options.classId);
      }
      return findPage(resource, options, actor);
    }),
    getById: serviceAction(async (id, actor) => {
      requirePermission(actor, `${resource}:read`);
      const record = await load(id);
      await requireClassAccess(actor, record.class_id);
      return record;
    }),
    create: serviceAction(async (body, actor) => {
      requirePermission(actor, `${resource}:write`);
      validateBody(body);
      await requireClassAccess(actor, body.classId, true);
      const data = prepare(body);
      return repository.create({ ...data, classId: body.classId, createdBy: actor.id });
    }),
    update: serviceAction(async (id, body, actor) => {
      requirePermission(actor, `${resource}:write`);
      validateBody(body);
      const record = await load(id);
      await requireClassAccess(actor, record.class_id, true);
      if (body.classId !== undefined || body.createdBy !== undefined) throw new BadRequestError("Class and creator cannot be changed");
      return requireRecord(await repository.update({ ...prepare(body, record), id }), label);
    }),
    delete: serviceAction(async (id, actor) => {
      requirePermission(actor, `${resource}:write`);
      const record = await load(id);
      await requireClassAccess(actor, record.class_id, true);
      return requireRecord(await repository.deleteById(id), label);
    }),
  };
};

export { classResourceService };
