import * as lessonProgressService from "../services/lesson_progress.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllLessonProgress = catchAsync(async (req, res) => {
  const lessonProgress = await lessonProgressService.getAllLessonProgress(
    req.query,
    req.user,
  );
  return sendSuccess(res, 200, "Retrieved successfully", lessonProgress);
});

const getLessonProgressById = catchAsync(async (req, res) => {
  const lessonProgressId = req.params.id;
  const lessonProgress = await lessonProgressService.getLessonProgressById(
    lessonProgressId,
    req.user,
  );
  return sendSuccess(res, 200, "Retrieved successfully", lessonProgress);
});

const completeLesson = catchAsync(async (req, res) => {
  const lessonId = req.params.id;
  const progress = await lessonProgressService.completeLesson(lessonId, req.user);
  return sendSuccess(res, 201, "Lesson marked as completed", progress);
});

const uncompleteLesson = catchAsync(async (req, res) => {
  const lessonId = req.params.id;
  await lessonProgressService.uncompleteLesson(lessonId, req.user);
  return sendSuccess(res, 200, "Lesson completion undone successfully");
});

const getClassProgress = catchAsync(async (req, res) => {
  const classId = req.params.id;
  const progress = await lessonProgressService.getClassProgress(
    classId,
    req.query,
    req.user,
  );
  return sendSuccess(res, 200, "Retrieved progress successfully", progress);
});

const deleteLessonProgress = catchAsync(async (req, res) => {
  const lessonProgressId = req.params.id;
  await lessonProgressService.deleteLessonProgress(lessonProgressId, req.user);
  return res.status(204).end();
});

export {
  getAllLessonProgress,
  getLessonProgressById,
  completeLesson,
  uncompleteLesson,
  getClassProgress,
  deleteLessonProgress,
};
