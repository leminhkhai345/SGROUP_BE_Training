import { Router } from "express";
import * as controller from "../controller/auth.controller.js";
import { loginRules, registerRules, validate } from "../middleware/validate.js";

import { createAuthLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
router.use(createAuthLimiter());
router.post("/register", validate(registerRules), controller.register);
router.post("/login", validate(loginRules), controller.login);
router.post("/refresh", controller.refresh);
export default router;
