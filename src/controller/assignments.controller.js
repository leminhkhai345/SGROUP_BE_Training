import * as assignmentService from "../services/assignments.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllAssignments = catchAsync(async (req, res) => {
  const assignments = await assignmentService.getAllAssignments(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", assignments);
});

const getAssignmentById = catchAsync(async (req, res) => {
  const assignmentId = req.params.id;
  const assignment = await assignmentService.getAssignmentById(assignmentId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", assignment);
});

const createAssignment = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const assignment = await assignmentService.createAssignment(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", assignment);
});

const updateAssignment = catchAsync(async (req, res) => {
  const assignmentId = req.params.id;
  const updateRequest = req.body;
  const assignment = await assignmentService.updateAssignment(assignmentId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", assignment);
});

const deleteAssignment = catchAsync(async (req, res) => {
  const assignmentId = req.params.id;
  await assignmentService.deleteAssignment(assignmentId, req.user);
  return res.status(204).end();
});

export { getAllAssignments, getAssignmentById, createAssignment, updateAssignment, deleteAssignment };
