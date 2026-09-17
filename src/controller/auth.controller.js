import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/responseHelper.js";
import catchAsync from "../utils/catchAsync.js";

const register = catchAsync(async (req, res) => {
  const {name, email, password} = req.body;
  const user = await authService.register({name, email, password});
  return sendSuccess(res, 200, "Users retrieved successfully", user);
});

const login = catchAsync(async (req, res) => {
  const { email, password} = req.body;
  const accessToken = await authService.login({email, password});
  return sendSuccess(res, 200, "Users retrieved successfully", accessToken);
});

export {register, login};
