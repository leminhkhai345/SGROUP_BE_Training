import * as repository from "../repository/lessons.repository.js";
import * as users from "../repository/users.repository.js";
import {
  requirePermission,
  requireClassAccess,
  isAdmin,
  sameId,
  getUserAccess,
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
import { BadRequestError, ForbiddenError } from "../core/error.response.js";
import { findPage } from "../repository/list.repository.js";
const prepare = async (body, actor, existing) => {
  validateBody(body);
  const data = pick(body, ["title", "content", "classId"]);
  if (!existing && !Object.keys(data).length) {
    throw new BadRequestError("No lesson fields supplied");
  }
  if (!existing) {
    if (!data.title) throw new BadRequestError("title is required");
    if (!data.classId) throw new BadRequestError("classId is required");
  }
  if (data.title !== undefined) {
    data.title = textField(data.title, "title", !existing);
    if (data.title.length < 2 || data.title.length > 255) {
      throw new BadRequestError("Title must be between 2 and 255 characters");
    }
  }
  if (data.content !== undefined && typeof data.content !== "string") {
    throw new BadRequestError("content must be a string");
  }

  if (data.classId !== undefined) {
    validateId(data.classId, "classId");
  }
  if (!existing && actor?.id) {
    data.createdBy = actor.id;
  }
  return data;
};
const getAllLessons = async (options = {}, actor) => {
  requirePermission(actor, "lessons:read");
  return findPage("lessons", options, actor);
};

const getLessonById = async (id, actor) => {
  requirePermission(actor, "lessons:read");
  return repository.findById(id, actor);
};

const createLesson = async (body, actor) => {
  requirePermission(actor, "lessons:create");
  const data = await prepare(body, actor);
  return repository.create(data, actor);
};

const updateLesson = async (id, body, actor) => {
  requirePermission(actor, "lessons:update");
  const data = await prepare(body, actor);
  return repository.update(id, data, actor);
};

const deleteLesson = async (id, actor) => {
  requirePermission(actor, "lessons:delete");
  return repository.delete(id, actor);
};

export {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
};
