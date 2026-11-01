import { Router } from "express";
import * as classMemberController from "../controller/class_members.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/", classMemberController.getAllClassMembers);
router.get("/:id", classMemberController.getClassMemberById);
router.post("/", classMemberController.createClassMember);
router.put("/:id", classMemberController.updateClassMember);
router.patch("/:id", classMemberController.updateClassMember);
router.delete("/:id", classMemberController.deleteClassMember);

export default router;
