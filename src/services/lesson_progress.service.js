import * as repository from "../repository/lesson_progress.repository.js";
import * as lessonrepository from "../repository/lessons.repository.js";
import {
  requirePermission,
  requireClassAccess,
} from "./authorization.service.js";
import {
  serviceAction,
  requireRecord,
  validateId,
  validateBody,
  textField,
  dateField,
  pick,
} from "../utils/serviceHelper.js";
import { canReadClass, isAdmin, sameId } from "./authorization.service.js";
import { BadRequestError, ForbiddenError } from "../core/error.response.js";
const prepare = async (body, actor, existing) => {
  validateBody(body);
  const data = pick(body, ["lessonId", "memberId", "completedAt"]);
  if (!existing && !Object.keys(data).length) {
    throw new BadRequestError("No lesson progress fields supplied");
  }
  if (!existing && !data.lessonId) {
    throw new BadRequestError("lessonId is required");
  }
  if (data.lessonId !== undefined) {
    validateId(data.lessonId, "lessonId");
  }
  if (data.memberId !== undefined) {
    validateId(data.memberId, "memberId");
  } else if (!existing) {
    data.memberId = actor.id;
  }
  if (data.completedAt !== undefined && data.completedAt !== null) {
    dateField(data.completedAt, "completedAt");
  }
  return data;
};
const getAllLessonProgress = async (options = {}, actor) => {
  if (options.lessonId) {
    validateId(options.lessonId, "lessonId");
    const lesson = requireRecord(
      await lessonRepository.findById(options.lessonId),
      "Lesson",
    );
    await requireClassAccess(actor, lesson.class_id, false);
  }
  if (!isAdmin(actor)) {
    options.memberId = actor.id;
  }

  return await repository.findAll(options);
};

const getLessonProgressById = async (id, actor) => {
  validateId(id, "lessonProgressId");
  const lessonProgress = requireRecord(
    await repository.findById(id),
    "LessonProgress",
  );
  const lesson = requireRecord(
    await lessonrepository.findById(lessonProgress.lesson_id),
    "Lesson",
  );
  await requireClassAccess(actor, lesson.class_id, false);
  return lessonProgress;
};

const createLessonProgress = async (body, actor) => {
  const data = await prepare(body, actor);
  const lesson = requireRecord(
    await lessonrepository.findById(data.lessonId),
    "Lesson",
  );
  await requireClassAccess(actor, lesson.class_id, false);
  return await repository.create(data);
};

const updateLessonProgress = async (id, body, actor) => {
  validateId(id, "lessonProgressId");
  const existing = requireRecord(
    await repository.findById(id),
    "LessonProgress",
  );
  const data = await prepare(body, actor, existing);
  const lesson = requireRecord(
    await lessonrepository.findById(existing.lesson_id),
    "Lesson",
  );
  await requireClassAccess(actor, lesson.class_id, false);
  return await repository.update({ ...data, id });
};

const deleteLessonProgress = async (id, actor) => {
  validateId(id, "lessonProgressId");
  const existing = requireRecord(
    await repository.findById(id),
    "LessonProgress",
  );
  const lesson = requireRecord(
    await lessonrepository.findById(existing.lesson_id),
    "Lesson",
  );
  await requireClassAccess(actor, lesson.class_id, false);
  return await repository.delete(id);
};

export {
  getAllLessonProgress,
  getLessonProgressById,
  createLessonProgress,
  updateLessonProgress,
  deleteLessonProgress,
};
