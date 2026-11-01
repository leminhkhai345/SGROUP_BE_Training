import * as classService from "../services/classes.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllClasses = catchAsync(async (req, res) => {
  const classes = await classService.getAllClasses(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", classes);
});

const getClassById = catchAsync(async (req, res) => {
  const classId = req.params.id;
  const classroom = await classService.getClassById(classId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", classroom);
});

const createClass = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const classroom = await classService.createClass(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", classroom);
});

const updateClass = catchAsync(async (req, res) => {
  const classId = req.params.id;
  const updateRequest = req.body;
  const classroom = await classService.updateClass(classId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", classroom);
});

const deleteClass = catchAsync(async (req, res) => {
  const classId = req.params.id;
  await classService.deleteClass(classId, req.user);
  return res.status(204).end();
});

export { getAllClasses, getClassById, createClass, updateClass, deleteClass };
