import {Router} from "express";
import * as userController from "../controller/users.controller.js";
import { updateUserRules, validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = new Router();

router.get("/me/", authenticate, userController.getMyProfile );
router.get("/", userController.getAllUsers);
router.get("/:id/", userController.getUserById);
router.put("/:id/", validate(updateUserRules), userController.updateUser);
router.delete("/:id/", userController.deleteUser);

export default router;