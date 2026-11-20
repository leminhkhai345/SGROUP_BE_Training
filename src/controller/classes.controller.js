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

const deleteClass = catchAsync(async (req, res) => {
  const classId = req.params.id;
  await classService.deleteClass(classId, req.user);
  return res.status(204).end();
});

const setClassMentor = catchAsync(async (req, res) => {
  const classroom = await classService.setClassMentor(req.params.id, req.body, req.user);
  return sendSuccess(res, 200, "Class mentor assigned successfully", classroom);
});

const unassignClassMentor = catchAsync(async (req, res) => {
  const classroom = await classService.unassignClassMentor(req.params.id, req.body, req.user);
  return sendSuccess(res, 200, "Class mentor unassigned successfully", classroom);
});

export { getAllClasses, getClassById, createClass, deleteClass, setClassMentor, unassignClassMentor };
