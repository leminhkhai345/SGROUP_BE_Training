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
  const lessonProgressid = req.params.id;
  const lessonProgress = await lessonProgressService.getLessonProgressById(
    lessonProgressid,
    req.user,
  );
  return sendSuccess(res, 200, "Retrieved successfully", lessonProgress);
});

const createLessonProgress = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const lessonProgress = await lessonProgressService.createLessonProgress(
    createRequest,
    req.user,
  );
  return sendSuccess(res, 201, "Created successfully", lessonProgress);
});

const updateLessonProgress = catchAsync(async (req, res) => {
  const lessonProgressid = req.params.id;
  const updateRequest = req.body;
  const lessonProgress = await lessonProgressService.updateLessonProgress(
    lessonProgressid,
    updateRequest,
    req.user,
  );
  return sendSuccess(res, 200, "Updated successfully", lessonProgress);
});

const deleteLessonProgress = catchAsync(async (req, res) => {
  const lessonProgressid = req.params.id;
  await lessonProgressService.deleteLessonProgress(lessonProgressid, req.user);
  return res.status(204).end();
});

export {
  getAllLessonProgress,
  getLessonProgressById,
  createLessonProgress,
  updateLessonProgress,
  deleteLessonProgress,
};
