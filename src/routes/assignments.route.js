import { Router } from "express";
import * as assignmentController from "../controller/assignments.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", assignmentController.getAllAssignments);
router.get("/:id", assignmentController.getAssignmentById);
router.post("/", assignmentController.createAssignment);
router.put("/:id", assignmentController.updateAssignment);
router.patch("/:id", assignmentController.updateAssignment);
router.delete("/:id", assignmentController.deleteAssignment);

export default router;
