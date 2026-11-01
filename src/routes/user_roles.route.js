import { Router } from "express";
import * as userRoleController from "../controller/user_roles.controller.js";
import { authenticate, authorizePermissions } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate, authorizePermissions("rbac:manage"));
router.get("/", userRoleController.getAllUserRoles);
router.post("/", userRoleController.assignRole);
router.get("/:userId/:roleId", userRoleController.getUserRole);
router.patch("/:userId/:roleId", userRoleController.updateUserRole);
router.delete("/:userId/:roleId", userRoleController.revokeRole);

export default router;
