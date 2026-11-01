import * as classMemberService from "../services/class_members.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllClassMembers = catchAsync(async (req, res) => {
  const classMembers = await classMemberService.getAllClassMembers(req.query, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", classMembers);
});

const getClassMemberById = catchAsync(async (req, res) => {
  const classMemberId = req.params.id;
  const classMember = await classMemberService.getClassMemberById(classMemberId, req.user);
  return sendSuccess(res, 200, "Retrieved successfully", classMember);
});

const createClassMember = catchAsync(async (req, res) => {
  const createRequest = req.body;
  const classMember = await classMemberService.createClassMember(createRequest, req.user);
  return sendSuccess(res, 201, "Created successfully", classMember);
});

const updateClassMember = catchAsync(async (req, res) => {
  const classMemberId = req.params.id;
  const updateRequest = req.body;
  const classMember = await classMemberService.updateClassMember(classMemberId, updateRequest, req.user);
  return sendSuccess(res, 200, "Updated successfully", classMember);
});

const deleteClassMember = catchAsync(async (req, res) => {
  const classMemberId = req.params.id;
  await classMemberService.deleteClassMember(classMemberId, req.user);
  return res.status(204).end();
});

export { getAllClassMembers, getClassMemberById, createClassMember, updateClassMember, deleteClassMember };
