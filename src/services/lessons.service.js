import * as repository from "../repository/lessons.repository.js";
import { classResourceService } from "../utils/classResourceService.js";
import { BadRequestError } from "../core/error.response.js";
import { pick, textField } from "../utils/serviceHelper.js";

const prepare = (body, existing) => {
  const data = pick(body, ["title", "content"]);
  if (!Object.keys(data).length) throw new BadRequestError("No lesson fields supplied");
  data.title = textField(data.title, "title", !existing);
  if (data.title !== undefined && (data.title.length < 2 || data.title.length > 255)) {
    throw new BadRequestError("Title must be between 2 and 255 characters");
  }
  if (data.content !== undefined && typeof data.content !== "string") throw new BadRequestError("content must be a string");
  return data;
};

// Use the shared class-resource flow for UUID validation and class ownership.
const service = classResourceService({ repository, resource: "lessons", label: "Lesson", prepare });
const getAllLessons = service.getAll;
const getLessonById = service.getById;
const createLesson = service.create;
const updateLesson = service.update;
const deleteLesson = service.delete;

export { getAllLessons, getLessonById, createLesson, updateLesson, deleteLesson };
