import * as repository from "../repository/lesson_progress.repository.js";
import * as lessons from "../repository/lessons.repository.js";
import * as members from "../repository/class_members.repository.js";
import { findPage } from "../repository/list.repository.js";
import { requirePermission, requireClassAccess, isAdmin, sameId, hasPermission } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId } from "../utils/serviceHelper.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../core/error.response.js";

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

const completeLesson = serviceAction(async (lessonId, actor) => {
  requirePermission(actor, "progress:write");
  validateId(lessonId, "lessonId");
  const lesson = requireRecord(await lessons.findById(lessonId), "Lesson");
  await requireClassAccess(actor, lesson.class_id);

  if (!isAdmin(actor)) {
    const enrollment = await members.findByClassAndMember(lesson.class_id, actor.id);
    if (!enrollment) {
      throw new ForbiddenError("You are not enrolled in this class");
    }
  }

  const existing = await repository.findByLessonAndMember(lessonId, actor.id);
  if (existing) {
    throw new ConflictError("Lesson already completed");
  }

  return repository.create({
    lessonId,
    memberId: actor.id,
    completedAt: new Date().toISOString(),
  });
});

const uncompleteLesson = serviceAction(async (lessonId, actor) => {
  requirePermission(actor, "progress:write");
  validateId(lessonId, "lessonId");
  const lesson = requireRecord(await lessons.findById(lessonId), "Lesson");
  await requireClassAccess(actor, lesson.class_id);

  const existing = await repository.findByLessonAndMember(lessonId, actor.id);
  if (!existing) {
    throw new NotFoundError("Lesson progress not found");
  }

  return requireRecord(await repository.deleteById(existing.id), "Lesson progress");
});

const getClassProgress = serviceAction(async (classId, query = {}, actor) => {
  requirePermission(actor, "progress:read");
  validateId(classId, "classId");
  const classroom = await requireClassAccess(actor, classId);

  const targetMemberId = query.memberId ?? actor.id;
  validateId(targetMemberId, "memberId");

  const isMentor = sameId(classroom.mentor_id, actor.id);
  if (!isAdmin(actor) && !isMentor && !sameId(targetMemberId, actor.id)) {
    throw new ForbiddenError("You can only view your own progress");
  }

  if (targetMemberId !== actor.id || query.memberId) {
    const isEnrolled = await members.findByClassAndMember(classId, targetMemberId);
    if (!isEnrolled) {
      throw new NotFoundError("Member is not enrolled in this class");
    }
  }

  const totalLessons = await lessons.countByClassId(classId);
  const completedLessons = await repository.countCompletedByClassAndMember(classId, targetMemberId);
  const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return {
    totalLessons,
    completedLessons,
    progress,
  };
});

const deleteLessonProgress = serviceAction(async (id, actor) => {
  requirePermission(actor, "progress:write");
  await load(id, actor, true);
  return requireRecord(await repository.deleteById(id), "Lesson progress");
});

export {
  getAllLessonProgress,
  getLessonProgressById,
  completeLesson,
  uncompleteLesson,
  getClassProgress,
  deleteLessonProgress,
};
