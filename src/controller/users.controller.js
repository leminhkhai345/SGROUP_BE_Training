import * as userService from "../services/users.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers(req.query, req.user);
  return sendSuccess(res, 200, "Users retrieved successfully", users);
});

const getUserById = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await userService.getUserById(userId, req.user);
  return sendSuccess(res, 200, "User retrieved successfully", user);
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const updateUserRequest = req.body;
  const user = await userService.updateUser(userId, updateUserRequest, req.user);
  return sendSuccess(res, 200, "User updated successfully", user);
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  await userService.deleteUser(userId, req.user);
  return res.status(204).end();
});

const getMyProfile = catchAsync(async (req, res) => {
  const profile = await userService.getMyProfile(req.user);
  return sendSuccess(res, 200, "Profile retrieved successfully", profile);
});

const updateAvatar = catchAsync(async (req, res) => {
  const result = await userService.updateAvatar(req.user, req.file);
  return sendSuccess(res, 200, "Avatar updated successfully", result);
});

export { getAllUsers, getUserById, updateUser, deleteUser, getMyProfile, updateAvatar };
