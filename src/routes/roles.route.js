import { Router } from "express";
import * as roleController from "../controller/roles.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getRoleById);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.patch("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

export default router;
