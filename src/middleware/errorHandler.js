import multer from "multer";
import ApiError from "../core/error.response.js";

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof ApiError) {
    const response = { success: false, message: err.message };
    if (err.errors) response.errors = err.errors;
    return res.status(err.statusCode).json(response);
  }
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooLarge ? 413 : 400).json({ success: false, message: tooLarge ? "Each file must not exceed 10MB" : "Invalid upload or too many files" });
  }
  if (err.type === "entity.parse.failed") return res.status(400).json({ success: false, message: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ success: false, message: "Request body is too large" });
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  return res.status(500).json({ success: false, message: "Internal server error" });
};

export default errorHandler;
