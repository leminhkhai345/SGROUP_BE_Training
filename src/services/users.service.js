import { findPage } from "../repository/list.repository.js";
import { prepareAvatar } from "../utils/avatar.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../core/error.response.js";
import * as repository from "../repository/users.repository.js";
import * as uploadService from "./upload.service.js";
import { requireActor, requirePermission, sameId, isAdmin } from "./authorization.service.js";
import { serviceAction, requireRecord, validateId, validateBody, pick, textField, dateField } from "../utils/serviceHelper.js";

const withAvatar = async (user) => ({ ...user, avt_url: await uploadService.getFileUrl(user.avt_url) });

const requireSelfOrPermission = (actor, id, permission) => {
  requireActor(actor);
  if (!sameId(actor.id, id)) requirePermission(actor, permission);
};
const getAllUsers = serviceAction(async (options = {}, actor) => {
  requirePermission(actor, "users:read");
  return Promise.all((await findPage("users", options, actor)).map(withAvatar));
});

const getUserById = serviceAction(async (id, actor) => {
  validateId(id);
  requireSelfOrPermission(actor, id, "users:read");
  return withAvatar(requireRecord(await repository.findById(id), "User"));
});

const updateUser = serviceAction(async (id, body, actor) => {
  validateId(id);
  requireSelfOrPermission(actor, id, "users:write");
  validateBody(body);
  if (["role", "roles", "permissions", "password", "password_hash"].some((field) => body[field] !== undefined)) throw new ForbiddenError("Role and credentials cannot be changed through profile updates");
  requireRecord(await repository.findById(id), "User");
  const data = pick(body, ["name", "email", "phone", "dob"]);
  if (!Object.keys(data).length) throw new BadRequestError("No user fields supplied");
  if (data.name !== undefined) {
    data.name = textField(data.name, "name");
    if (data.name.length < 2 || data.name.length > 50) throw new BadRequestError("Name must contain 2 to 50 characters");
  }
  if (data.email !== undefined) {
    data.email = textField(data.email, "email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new BadRequestError("Invalid email");
    const duplicate = await repository.findByEmail(data.email);
    if (duplicate && !sameId(duplicate.id, id)) throw new ConflictError("Email already exists");
  }
  if (data.phone !== undefined) data.phone = textField(data.phone, "phone");
  dateField(data.dob, "dob");
  return withAvatar(requireRecord(await repository.update(id, data), "User"));
});

const deleteUser = serviceAction(async (id, actor) => {
  requirePermission(actor, "users:write");
  validateId(id);
  if (sameId(actor.id, id) && isAdmin(actor)) throw new BadRequestError("Administrators cannot delete their own account");
  return requireRecord(await repository.deleteById(id), "User");
});

const getMyProfile = serviceAction(async (actor) => {
  requireActor(actor);
  const user = requireRecord(await repository.findById(actor.id), "User");
  return { ...user, roles: actor.roles, permissions: actor.permissions, avt_url: await uploadService.getFileUrl(user.avt_url) };
});

const updateAvatar = serviceAction(async (actor, file) => {
  requirePermission(actor, "uploads:write");
  const existing = requireRecord(await repository.findById(actor.id), "User");
  const result = await uploadService.uploadFile(await prepareAvatar(file), undefined, actor.id);
  let data;
  try {
    data = await repository.updateAvatar(actor.id, result.key, existing.avt_url);
    if (!data) throw new ConflictError("Avatar changed concurrently; reload before retrying");
  } catch (error) {
    await uploadService.deleteFile(result.key).catch((cleanupError) => console.error("Avatar cleanup failed:", cleanupError.message));
    throw error;
  }
  if (existing.avt_url && existing.avt_url !== result.key) {
    await uploadService.deleteFile(existing.avt_url).catch((error) => console.error("Old avatar cleanup failed:", error.message));
  }
  return { ...data, avt_url: result.url };
});

export {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMyProfile,
  updateAvatar,
};
