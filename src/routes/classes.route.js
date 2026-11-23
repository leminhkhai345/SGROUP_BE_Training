import { Router } from "express";
import * as classController from "../controller/classes.controller.js";
import * as lessonProgressController from "../controller/lesson_progress.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", classController.getAllClasses);
router.get("/:id/progress", lessonProgressController.getClassProgress);
router.get("/:id", classController.getClassById);
router.post("/", classController.createClass);
router.put("/:id/set-mentor", classController.setClassMentor);
router.put("/:id/unassign-mentor", classController.unassignClassMentor);
router.delete("/:id", classController.deleteClass);

export default router;
