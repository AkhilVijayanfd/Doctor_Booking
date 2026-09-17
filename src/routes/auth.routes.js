import { Router } from "express";
import { getMe, login, register } from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", registerValidator, validateRequest, register);
router.post("/login", loginValidator, validateRequest, login);
router.get("/me", authenticate, getMe);

export default router;
