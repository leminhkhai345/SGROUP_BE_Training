import { Router } from "express";
import * as rolePermissionController from "../controller/role_permissions.controller.js";
import { authenticate, authorizePermissions } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, authorizePermissions("rbac:manage"));
router.get("/", rolePermissionController.getAllRolePermissions);
router.post("/", rolePermissionController.grantPermission);
router.get("/:roleId/:permissionId", rolePermissionController.getRolePermission);
router.patch("/:roleId/:permissionId", rolePermissionController.updateRolePermission);
router.delete("/:roleId/:permissionId", rolePermissionController.revokePermission);

export default router;
