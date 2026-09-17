import { Router } from "express";   
import * as authController from "../controller/auth.controller.js";
import { loginRules, registerRules, validate } from "../middleware/validate.js";

const router = new Router();

router.post("/register", validate(registerRules), authController.register);
router.post("/login", validate(loginRules), authController.login)

export default router;