import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ForbiddenError } from "../core/error.response.js";
import * as repository from "../repository/classes.repository.js";
import * as users from "../repository/users.repository.js";
import * as classMembers from "../repository/class_members.repository.js";
import { requirePermission, requireClassAccess, isAdmin, sameId, getUserAccess } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, textField, dateField, pick } from "../utils/serviceHelper.js";

const prepare = async (body, actor, existing) => {
  validateBody(body);
  const data = pick(body, ["name", "description", "startDate", "endDate", "mentorId"]);
  if (!Object.keys(data).length) throw new BadRequestError("No class fields supplied");
  data.name = textField(data.name, "name", !existing);
  if (data.description !== undefined && typeof data.description !== "string") throw new BadRequestError("description must be a string");
  dateField(data.startDate, "startDate");
  dateField(data.endDate, "endDate");
  const start = data.startDate ?? existing?.start_date;
  const end = data.endDate ?? existing?.end_date;
  if (start && end && new Date(start) > new Date(end)) throw new BadRequestError("endDate must be on or after startDate");
  if (!existing && data.mentorId !== undefined) throw new BadRequestError("Create the class first, add a member, then assign that member as mentor");
  if (data.mentorId !== undefined) {
    if (!isAdmin(actor)) throw new ForbiddenError("Only administrators can assign a class mentor");
    if (data.mentorId !== null) {
      validateId(data.mentorId, "mentorId");
      const mentor = requireRecord(await users.findById(data.mentorId), "Class member");
      const access = await getUserAccess(mentor.id);
      if (!access.roles.includes("MEMBER")) throw new BadRequestError("Class mentor must have the MEMBER role");
      if (!await classMembers.findByClassAndMember(existing.id, mentor.id)) throw new BadRequestError("Class mentor must be an active member of this class");
    }
  }
  return data;
};

const getAllClasses = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "classes:read");
  return findPage("classes", options, actor);
});

const getClassById = serviceAction(async (id, actor) => {
  requirePermission(actor, "classes:read");
  return requireClassAccess(actor, id);
});

const createClass = serviceAction(async (body, actor) => {
  requirePermission(actor, "classes:write");
  if (!isAdmin(actor)) throw new ForbiddenError("Only administrators can create classes");
  return repository.create(await prepare(body, actor));
});

const updateClass = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "classes:write");
  validateBody(body);
  if (body.mentorId !== undefined && !isAdmin(actor)) throw new ForbiddenError("Only administrators can assign a class mentor");
  const existing = await requireClassAccess(actor, id, true);
  return requireRecord(await repository.update({ ...await prepare(body, actor, existing), id }), "Class");
});

const deleteClass = serviceAction(async (id, actor) => {
  requirePermission(actor, "classes:write");
  await requireClassAccess(actor, id, true);
  return requireRecord(await repository.deleteById(id), "Class");
});

export {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
