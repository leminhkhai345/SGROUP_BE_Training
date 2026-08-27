import {Router} from "express";
import * as userController from "../controller/users.controller.js";
import { createUserRules, updateUserRules, validate } from "../middleware/validate.js";

const router = new Router();

router.get("/", userController.getAllUsers);
router.get("/:id/", userController.getUserById);
router.post("/", validate(createUserRules), userController.createUser);
router.put("/:id/", validate(updateUserRules), userController.updateUser);
router.delete("/:id/", userController.deleteUser);
export default router;