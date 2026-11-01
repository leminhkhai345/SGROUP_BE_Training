import multer from "multer";
import { BadRequestError } from "../core/error.response.js";

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const multiUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 5 } });
const requireFile = (req, res, next) => {
  if (!req.file && !req.files?.length) return next(new BadRequestError("At least one file is required"));
  next();
};
const uploadFiveFiles = multiUpload.array("files", 5);
export { upload, requireFile, multiUpload, uploadFiveFiles };
