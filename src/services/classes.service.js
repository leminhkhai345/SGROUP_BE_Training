import { findPage } from "../repository/list.repository.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/error.response.js";
import * as repository from "../repository/classes.repository.js";
import * as users from "../repository/users.repository.js";
import * as classMembers from "../repository/class_members.repository.js";
import { requirePermission, requireClassAccess, isAdmin, sameId, getUserAccess } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, textField, dateField, pick } from "../utils/serviceHelper.js";

const prepare = (body) => {
  validateBody(body);
  if (body.mentorId !== undefined || body.action !== undefined) throw new BadRequestError("Use the set-mentor or unassign-mentor endpoint to manage the class mentor");
  const data = pick(body, ["name", "description", "startDate", "endDate"]);
  if (!Object.keys(data).length) throw new BadRequestError("No class fields supplied");
  data.name = textField(data.name, "name", true);
  if (data.description !== undefined && typeof data.description !== "string") throw new BadRequestError("description must be a string");
  dateField(data.startDate, "startDate");
  dateField(data.endDate, "endDate");
  const start = data.startDate;
  const end = data.endDate;
  if (start && end && new Date(start) > new Date(end)) throw new BadRequestError("endDate must be on or after startDate");
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
  return repository.create(prepare(body));
});

const validateMentorRequest = (id, body, actor) => {
  requirePermission(actor, "classes:write");
  if (!isAdmin(actor)) throw new ForbiddenError("Only administrators can manage a class mentor");
  validateId(id, "classId");
  validateBody(body);
  if (Object.keys(body).some((key) => key !== "mentorId")) {
    throw new BadRequestError('Mentor requests accept only "mentorId"');
  }
  validateId(body.mentorId, "mentorId");
};

const setClassMentor = serviceAction(async (id, body, actor) => {
  validateMentorRequest(id, body, actor);
  requireRecord(await repository.findById(id), "Class");
  const mentor = requireRecord(await users.findById(body.mentorId), "Member");
  const access = await getUserAccess(mentor.id);
  if (!access.roles.includes("MEMBER")) throw new BadRequestError("Class mentor must have the MEMBER role");
  if (!await classMembers.findByClassAndMember(id, mentor.id)) throw new BadRequestError("Class mentor must be an active member of this class");
  return requireRecord(await repository.update({ id, mentorId: mentor.id }), "Class");
});

const unassignClassMentor = serviceAction(async (id, body, actor) => {
  validateMentorRequest(id, body, actor);
  const existing = requireRecord(await repository.findById(id), "Class");
  if (!existing.mentor_id) throw new ConflictError("Class has no assigned mentor");
  if (!sameId(existing.mentor_id, body.mentorId)) throw new ConflictError("mentorId does not match the class's current mentor");
  const classroom = await repository.unassignMentor(id, body.mentorId);
  if (!classroom) throw new ConflictError("Class mentor changed concurrently; reload and retry");
  return classroom;
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
  setClassMentor,
  unassignClassMentor,
  deleteClass,
};
