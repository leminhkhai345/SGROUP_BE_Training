import { BadRequestError, ConflictError } from "../core/error.response.js";
import * as repository from "../repository/class_members.repository.js";
import * as users from "../repository/users.repository.js";
import { requirePermission, requireClassAccess, getUserAccess, sameId } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, dateField } from "../utils/serviceHelper.js";
import { findPage } from "../repository/list.repository.js";

const getAllClassMembers = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "classes:read");
  if (options.classId !== undefined) {
    await requireClassAccess(actor, options.classId);
  }
  return findPage("class_members", options, actor);
});

const getClassMemberById = serviceAction(async (id, actor) => {
  requirePermission(actor, "classes:read");
  validateId(id);
  const member = requireRecord(await repository.findById(id), "Class member");
  await requireClassAccess(actor, member.class_id);
  return member;
});

const createClassMember = serviceAction(async (body, actor) => {
  requirePermission(actor, "classes:members");
  validateBody(body);
  await requireClassAccess(actor, body.classId, true);
  validateId(body.memberId, "memberId");
  const user = requireRecord(await users.findById(body.memberId), "Member");
  const access = await getUserAccess(user.id);
  if (!access.roles.includes("MEMBER")) throw new BadRequestError("Only users with the MEMBER role can join a class");
  dateField(body.joinAt, "joinAt");
  if (await repository.findByClassAndMember(body.classId, body.memberId)) throw new ConflictError("Member already belongs to this class");
  return repository.create({ classId: body.classId, memberId: body.memberId, joinAt: body.joinAt });
});

const updateClassMember = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "classes:members");
  validateId(id);
  validateBody(body);
  const member = requireRecord(await repository.findById(id), "Class member");
  await requireClassAccess(actor, member.class_id, true);
  if (body.classId !== undefined || body.memberId !== undefined) throw new BadRequestError("Membership identity cannot be changed");
  if (body.joinAt === undefined) throw new BadRequestError("joinAt is required");
  dateField(body.joinAt, "joinAt");
  return requireRecord(await repository.update({ id, joinAt: body.joinAt }), "Class member");
});

const deleteClassMember = serviceAction(async (id, actor) => {
  requirePermission(actor, "classes:members");
  validateId(id);
  const member = requireRecord(await repository.findById(id), "Class member");
  const classroom = await requireClassAccess(actor, member.class_id, true);
  if (sameId(classroom.mentor_id, member.member_id)) throw new BadRequestError("Assign another class mentor before removing this member");
  return requireRecord(await repository.deleteById(id), "Class member");
});

export {
  getAllClassMembers,
  getClassMemberById,
  createClassMember,
  updateClassMember,
  deleteClassMember,
};
