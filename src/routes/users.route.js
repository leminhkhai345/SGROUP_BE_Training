import { Router } from "express";
import * as controller from "../controller/users.controller.js";
import { updateUserRules, validate } from "../middleware/validate.js";
import { authenticate, authorizePermissions } from "../middleware/auth.middleware.js";
import { upload, requireFile } from "../middleware/upload.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/me", controller.getMyProfile);
router.get("/", authorizePermissions("users:read"), controller.getAllUsers);
router.post("/avatar", authorizePermissions("uploads:write"), upload.single("file"), requireFile, controller.updateAvatar);
router.get("/:id", controller.getUserById);
router.put("/:id", validate(updateUserRules), controller.updateUser);
router.patch("/:id", validate(updateUserRules), controller.updateUser);
router.delete("/:id", authorizePermissions("users:write"), controller.deleteUser);
export default router;
