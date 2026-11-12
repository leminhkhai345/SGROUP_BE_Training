import { requirePermission, isAdmin } from "./authorization.service.js";
import { validateId, validateBody } from "../utils/serviceHelper.js";
import { ForbiddenError } from "../core/error.response.js";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { UUID_PATTERN } from "../utils/idHelper.js";
import r2Client from "../config/r2.config.js";
import ApiError, { BadRequestError, ServiceUnavailableError } from "../core/error.response.js";

const storageAction = (action) => async (...args) => {
  try { return await action(...args); }
  catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Storage operation failed:", error.message);
    throw new ServiceUnavailableError("File storage is temporarily unavailable");
  }
};
const deleteFile = storageAction(async (key) => {
  if (!key) return;
  await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
});

const getFileUrl = storageAction(async (key) => {
  if (!key) return null;
  if (typeof key !== "string") throw new BadRequestError("Invalid file key");
  return getSignedUrl(r2Client, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }), { expiresIn: 3600 });
});

const uploadFile = storageAction(async (file, onUploaded, ownerId) => {
  if (!file || !Buffer.isBuffer(file.buffer) || typeof file.originalname !== "string" || typeof file.mimetype !== "string") throw new BadRequestError("A valid file is required");
  if (file.buffer.length > 10 * 1024 * 1024) throw new BadRequestError("File must not exceed 10MB");
  const extension = file.originalname.split(".").pop();
  const fileName = `${randomUUID()}.${/^[a-z0-9]{1,10}$/i.test(extension) ? extension : "bin"}`;
  if (ownerId !== undefined) validateId(ownerId, "ownerId");
  const key = `uploads/${ownerId !== undefined ? `${ownerId}/` : ""}${fileName}`;
  await r2Client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: file.buffer, ContentType: file.mimetype }));
  onUploaded?.(key);
  try {
    return { key, fileName, url: await getFileUrl(key) };
  } catch (error) {
    if (!onUploaded) await deleteFile(key).catch((cleanupError) => console.error("Upload cleanup failed:", cleanupError.message));
    throw error;
  }
});

const uploadMultiFiles = storageAction(async (files, ownerId) => {
  if (!Array.isArray(files) || !files.length || files.length > 5) throw new BadRequestError("Please upload 1 to 5 files");
  const uploadedKeys = [];
  const results = await Promise.allSettled(files.map((file) => uploadFile(file, (key) => uploadedKeys.push(key), ownerId)));
  const failed = results.find((result) => result.status === "rejected");
  if (failed) {
    const cleanup = await Promise.allSettled(uploadedKeys.map(deleteFile));
    cleanup.forEach((result) => { if (result.status === "rejected") console.error("R2 cleanup failed:", result.reason.message); });
    throw failed.reason;
  }
  return results.map((result) => result.value);
});

const fileKeyPattern = new RegExp(`^uploads/(?:${UUID_PATTERN}/)?${UUID_PATTERN}\\.[a-z0-9]{1,10}$`, "i");
const refreshFileUrl = async (body, actor) => {
  requirePermission(actor, "uploads:write");
  validateBody(body);
  const key = body.key;
  if (typeof key !== "string" || !fileKeyPattern.test(key)) throw new BadRequestError("Invalid file key");
  if (!isAdmin(actor) && !key.startsWith(`uploads/${actor.id}/`) && key !== actor.avt_url) throw new ForbiddenError("You cannot access this file");
  return { key, url: await getFileUrl(key), expiresIn: 3600 };
};

export {
  deleteFile,
  getFileUrl,
  uploadFile,
  uploadMultiFiles,
  refreshFileUrl,
};
