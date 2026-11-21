import { Router } from "express";
import * as lessonProgressController from "../controller/lesson_progress.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", lessonProgressController.getAllLessonProgress);
router.get("/:id", lessonProgressController.getLessonProgressById);
router.delete("/:id", lessonProgressController.deleteLessonProgress);

export default router;
