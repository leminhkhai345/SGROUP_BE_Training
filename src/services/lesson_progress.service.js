import * as repository from "../repository/lesson_progress.repository.js";
import * as lessons from "../repository/lessons.repository.js";
import { findPage } from "../repository/list.repository.js";
import { requirePermission, requireClassAccess, isAdmin, sameId, hasPermission } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, dateField } from "../utils/serviceHelper.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/error.response.js";

const lessonClass = async (lessonId, actor) => {
  validateId(lessonId, "lessonId");
  const lesson = requireRecord(await lessons.findById(lessonId), "Lesson");
  return requireClassAccess(actor, lesson.class_id);
};
const load = async (id, actor, write = false) => {
  validateId(id, "lessonProgressId");
  const record = requireRecord(await repository.findById(id), "Lesson progress");
  const classroom = await lessonClass(record.lesson_id, actor);
  const allowed = sameId(record.member_id, actor.id) || isAdmin(actor) || (!write && hasPermission(actor, "progress:read") && sameId(classroom.mentor_id, actor.id));
  if (!allowed) throw new ForbiddenError("You cannot access another member's progress");
  return record;
};

const getAllLessonProgress = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "progress:read");
  if (options.lessonId !== undefined) await lessonClass(options.lessonId, actor);
  return findPage("lesson_progress", options, actor);
});
const getLessonProgressById = serviceAction(async (id, actor) => {
  requirePermission(actor, "progress:read");
  return load(id, actor);
});
const createLessonProgress = serviceAction(async (body, actor) => {
  requirePermission(actor, "progress:write");
  validateBody(body);
  const memberId = body.memberId ?? actor.id;
  validateId(memberId, "memberId");
  if (!isAdmin(actor) && !sameId(memberId, actor.id)) throw new ForbiddenError("You can only create your own progress");
  await lessonClass(body.lessonId, actor);
  if (body.completedAt !== null) dateField(body.completedAt, "completedAt");
  if (await repository.findByLessonAndMember(body.lessonId, memberId)) throw new ConflictError("Lesson progress already exists");
  return repository.create({ lessonId: body.lessonId, memberId, completedAt: body.completedAt });
});
const updateLessonProgress = serviceAction(async (id, body, actor) => {
  requirePermission(actor, "progress:write");
  validateBody(body);
  await load(id, actor, true);
  if (body.lessonId !== undefined || body.memberId !== undefined) throw new BadRequestError("Progress identity cannot be changed");
  if (body.completedAt === undefined) throw new BadRequestError("completedAt is required");
  if (body.completedAt !== null) dateField(body.completedAt, "completedAt");
  return requireRecord(await repository.update({ id, completedAt: body.completedAt }), "Lesson progress");
});
const deleteLessonProgress = serviceAction(async (id, actor) => {
  requirePermission(actor, "progress:write");
  await load(id, actor, true);
  return requireRecord(await repository.deleteById(id), "Lesson progress");
});

export { getAllLessonProgress, getLessonProgressById, createLessonProgress, updateLessonProgress, deleteLessonProgress };
