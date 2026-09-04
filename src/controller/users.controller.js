import { ForbiddenError, NotFoundError } from "../core/error.response.js";
import * as userService from "../services/users.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  return sendSuccess(res, 200, "Users retrieved successfully", users);
});

const getUserById = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await userService.getUserById(userId);
  return sendSuccess(res, 200, "User retrieved successfully", user);
});

const createUser = catchAsync(async (req, res) => {
  const createUserRequest = req.body;

  const user = await userService.addUser(createUserRequest);

  return sendSuccess(res, 201, "create user successfully", user);
});

const updateUser = catchAsync(async (req, res) => {
  const updateUserRequest = req.body;
  const userId = req.params.id;

  const user = await userService.updateUser(userId, updateUserRequest);

  return sendSuccess(res, 201, "update user successfully", user);
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;

  userService.deleteUser(userId);

  return sendSuccess(res, 204, "delete user successfully");
});

export { getAllUsers, getUserById, createUser, updateUser, deleteUser };
