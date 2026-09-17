import * as userService from "../services/users.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const getAllUsers = catchAsync(async (req, res) => {
  const sortBy = req.params.sortBy;
  const order = req.params.order;
  const users = await userService.getAllUsers({sortBy, order});
  return sendSuccess(res, 200, "Users retrieved successfully", users);
});

const getUserById = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await userService.getUserById(userId);
  return sendSuccess(res, 200, "User retrieved successfully", user);
});



const updateUser = catchAsync(async (req, res) => {
  const updateUserRequest = req.body;
  const userId = req.params.id;

  const user = await userService.updateUser(userId, updateUserRequest);

  return sendSuccess(res, 201, "update user successfully", user);
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;

  await userService.deleteUser(userId);

  return sendSuccess(res, 204, "delete user successfully");
});


const getMyProfile = catchAsync(async (req, res, next) => {
  const email = req.user.email;
  const result = await userService.getMyProfile(email);
  return sendSuccess(res, 200, "get my profile", result);
});

export { getAllUsers, getUserById, updateUser, deleteUser, getMyProfile };
