import { Router } from "express";
import { upload, requireFile, uploadFiveFiles } from "../middleware/upload.middleware.js";
import { authenticate, authorizePermissions } from "../middleware/auth.middleware.js";
import { uploadFileController, uploadMultiFilesController, refreshFileUrlController } from "../controller/upload.controller.js";

const router = Router();
router.use(authenticate, authorizePermissions("uploads:write"));
router.post("/", upload.single("file"), requireFile, uploadFileController);
router.post("/url", refreshFileUrlController);
router.post("/multiple", uploadFiveFiles, requireFile, uploadMultiFilesController);
export default router;
