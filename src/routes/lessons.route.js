import { Router } from "express";
import * as lessonController from "../controller/lessons.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", lessonController.getAllLessons);
router.get("/:id", lessonController.getLessonById);
router.post("/", lessonController.createLesson);
router.put("/:id", lessonController.updateLesson);
router.patch("/:id", lessonController.updateLesson);
router.delete("/:id", lessonController.deleteLesson);

export default router;
