import { Router } from "express";
import userRouter from "./users.route.js";

const router = new Router();
router.use("/users", userRouter);

export default router;