import { Router } from "express";
import * as submissionController from "../controller/submissions.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", submissionController.getAllSubmissions);
router.get("/:id", submissionController.getSubmissionById);
router.post("/", submissionController.createSubmission);
router.put("/:id", submissionController.updateSubmission);
router.delete("/:id", submissionController.deleteSubmission);
router.put("/:id/review", submissionController.reviewSubmission);

export default router;
