import { Router } from "express";
import * as classController from "../controller/classes.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);
router.post("/", classController.createClass);
router.put("/:id", classController.updateClass);
router.patch("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);

export default router;
