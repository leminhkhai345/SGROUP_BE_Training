import * as lessonService from "../services/lessons.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllLessons = catchAsync(async (req, res) => {
  const Lessons = await lessonService.getAllLessons(req.query, req.user);
  sendSuccess(res, 200, "Retrieved successfully", Lessons);
});

const getLessonById = catchAsync(async (req, res) => {
  const lessonid = req.params.id;
  const lesson = await lessonService.getLessonById(lessonid, req.user);
  sendSuccess(res, 200, "Retrieved successfully", lesson);
});

const createLesson = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const lesson = await lessonService.createLesson(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", lesson);
});

const updateLesson = catchAsync(async (req, res) => {
    const lessonid = req.params.id;
    const updateRequest = req.body;
    const lesson = await lessonService.updateLesson(lessonid, updateRequest, req.user);
    return sendSuccess(res, 200, "Updated successfully", lesson);
});

const deleteLesson = catchAsync(async (req, res) => {
    const lessonid = req.params.id;
    await lessonService.deleteLesson(lessonid, req.user);
    return res.status(204).end();
});

export {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
};
