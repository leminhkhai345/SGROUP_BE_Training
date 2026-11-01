import { Router } from "express";
import * as permissionController from "../controller/permissions.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", permissionController.getAllPermissions);
router.get("/:id", permissionController.getPermissionById);
router.post("/", permissionController.createPermission);
router.put("/:id", permissionController.updatePermission);
router.patch("/:id", permissionController.updatePermission);
router.delete("/:id", permissionController.deletePermission);

export default router;
