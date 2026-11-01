import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/responseHelper.js";
import catchAsync from "../utils/catchAsync.js";

const register = catchAsync(async (req, res) => {
  const registerRequest = req.body;
  const user = await authService.register(registerRequest);
  return sendSuccess(res, 201, "Registered successfully", user);
});

const login = catchAsync(async (req, res) => {
  const loginRequest = req.body;
  const tokens = await authService.login(loginRequest);
  return sendSuccess(res, 200, "Logged in successfully", tokens);
});

const refresh = catchAsync(async (req, res) => {
  const refreshRequest = req.body;
  const tokens = await authService.refresh(refreshRequest);
  return sendSuccess(res, 200, "Token refreshed successfully", tokens);
});

export { register, login, refresh };
