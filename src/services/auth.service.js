import { BadRequestError, ConflictError, UnauthorizedError } from "../core/error.response.js";
import * as users from "../repository/users.repository.js";
import * as passwords from "../utils/passwordHelper.js";
import * as tokens from "../utils/jwtHelper.js";
import { getUserAccess } from "./authorization.service.js";
import { serviceAction, validateBody, textField } from "../utils/serviceHelper.js";

const credentials = (input, registration = false) => {
  validateBody(input);
  const email = textField(input.email, "email", true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestError("Invalid email");
  if (typeof input.password !== "string" || !input.password.length) throw new BadRequestError("Password is required");
  if (Buffer.byteLength(input.password, "utf8") > 72 || (registration && input.password.length < 6)) {
    throw new BadRequestError("Password must contain at least 6 characters and at most 72 UTF-8 bytes");
  }
  return { email, password: input.password };
};

const register = serviceAction(async (input) => {
  const { email, password } = credentials(input, true);
  const name = textField(input.name, "name", true);
  if (name.length < 2 || name.length > 50) throw new BadRequestError("Name must contain 2 to 50 characters");
  if (await users.findByEmail(email)) throw new ConflictError("Email already exists");
  return users.create({ name, email, password_hash: await passwords.hashPassword(password), role: "MEMBER" });
});

const issueTokens = (user) => {
  const payload = { id: user.id };
  return { accessToken: tokens.generateToken(payload), refreshToken: tokens.generateRefreshToken(payload) };
};

const login = serviceAction(async (input) => {
  const { email, password } = credentials(input);
  const user = await users.findByEmail(email);
  if (!user || !await passwords.comparePassword(password, user.password_hash)) {
    throw new UnauthorizedError("Email or password is incorrect");
  }
  await getUserAccess(user.id);
  return issueTokens(user);
});

const refresh = serviceAction(async (input) => {
  validateBody(input);
  if (typeof input.refreshToken !== "string" || !input.refreshToken) throw new BadRequestError("refreshToken is required");
  let payload;
  try {
    payload = tokens.verifyRefreshToken(input.refreshToken);
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) throw new UnauthorizedError("Invalid or expired refresh token");
    throw error;
  }
  const user = await getUserAccess(payload.id);
  return issueTokens(user);
});

export { register, login, refresh };
