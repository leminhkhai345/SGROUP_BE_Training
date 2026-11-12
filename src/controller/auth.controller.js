import * as authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/responseHelper.js";
import catchAsync from "../utils/catchAsync.js";
import { config } from "../config/env.config.js";

// Setting and clearing must use the same cookie path and security flags.
const refreshCookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict",
  secure: config.app.nodeEnv === "production",
  path: "/auth/refresh",
});

const setRefreshCookie = (res, refreshToken) => res.cookie("refreshToken", refreshToken, refreshCookieOptions());

const readRefreshCookie = (req) => {
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("refreshToken="));
  return cookie ? decodeURIComponent(cookie.slice("refreshToken=".length)) : undefined;
};

const register = catchAsync(async (req, res) => {
  const registerRequest = req.body;
  const user = await authService.register(registerRequest);
  return sendSuccess(res, 201, "Registered successfully", user);
});

const login = catchAsync(async (req, res) => {
  const loginRequest = req.body;
  const tokens = await authService.login(loginRequest);
  setRefreshCookie(res, tokens.refreshToken);
  return sendSuccess(res, 200, "Logged in successfully", { accessToken: tokens.accessToken });
});

const refresh = catchAsync(async (req, res) => {
  const refreshRequest = { ...req.body, refreshToken: readRefreshCookie(req) ?? req.body?.refreshToken };
  const tokens = await authService.refresh(refreshRequest);
  setRefreshCookie(res, tokens.refreshToken);
  return sendSuccess(res, 200, "Token refreshed successfully", { accessToken: tokens.accessToken });
});

// Stateless JWT logout clears the browser cookie, even when tokens have expired.
// The client must also discard its access token. No server-side revocation occurs.
const logout = (req, res) => {
  res.clearCookie("refreshToken", refreshCookieOptions());
  return res.status(204).end();
};

export { register, login, refresh, logout };
