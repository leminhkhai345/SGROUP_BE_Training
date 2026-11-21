import { Router } from "express";
import * as lessonController from "../controller/lessons.controller.js";
import * as lessonProgressController from "../controller/lesson_progress.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", lessonController.getAllLessons);
router.get("/:id", lessonController.getLessonById);
router.post("/", lessonController.createLesson);
router.put("/:id", lessonController.updateLesson);
router.delete("/:id", lessonController.deleteLesson);

router.post("/:id/complete", lessonProgressController.completeLesson);
router.delete("/:id/complete", lessonProgressController.uncompleteLesson);

export default router;
