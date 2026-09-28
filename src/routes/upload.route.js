import express from "express";

import {upload, requireFile, uploadFiveFiles} from "../middleware/upload.middleware.js";
import { uploadFileController, uploadMultiFilesController } from "../controller/upload.controller.js";

const router = express.Router();

router.post(
    "/",
    upload.single("file"),
    requireFile,
    uploadFileController
);

router.post(
    "/multiple",
    uploadFiveFiles,
    requireFile,
    uploadMultiFilesController
);


export default router;
