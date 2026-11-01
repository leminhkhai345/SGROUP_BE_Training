import * as uploadService from "../services/upload.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const uploadFileController = catchAsync(async (req, res) => {
  const result = await uploadService.uploadFile(req.file, undefined, req.user.id);
  return sendSuccess(res, 201, "Upload file successfully", result);
});

const uploadMultiFilesController = catchAsync(async (req, res) => {
  const files = await uploadService.uploadMultiFiles(req.files, req.user.id);
  return sendSuccess(res, 201, "Upload files successfully", {
    count: files.length,
    files,
  });
});

const refreshFileUrlController = catchAsync(async (req, res) => {
  return sendSuccess(res, 200, "File URL refreshed successfully", await uploadService.refreshFileUrl(req.body, req.user));
});

export {
  uploadFileController,
  uploadMultiFilesController,
  refreshFileUrlController,
};
