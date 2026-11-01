import * as submissionService from "../services/submissions.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllSubmissions = catchAsync(async (req, res) => {
  const submissions = await submissionService.getAllSubmissions(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", submissions);
});

const getSubmissionById = catchAsync(async (req, res) => {
  const submissionId = req.params.id;
  const submission = await submissionService.getSubmissionById(submissionId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", submission);
});

const createSubmission = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const submission = await submissionService.createSubmission(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", submission);
});

const updateSubmission = catchAsync(async (req, res) => {
  const submissionId = req.params.id;
  const updateRequest = req.body;
  const submission = await submissionService.updateSubmission(submissionId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", submission);
});

const deleteSubmission = catchAsync(async (req, res) => {
  const submissionId = req.params.id;
  await submissionService.deleteSubmission(submissionId, req.user);
  return res.status(204).end();
});

const reviewSubmission = catchAsync(async (req, res) => {
  const submissionId = req.params.id;
  const reviewRequest = req.body;
  const submission = await submissionService.reviewSubmission(submissionId, reviewRequest, req.user);
  return sendSuccess(res, 200, "Submission reviewed successfully", submission);
});

export { getAllSubmissions, getSubmissionById, createSubmission, updateSubmission, deleteSubmission, reviewSubmission };
