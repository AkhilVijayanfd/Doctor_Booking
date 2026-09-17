import { Router } from "express";
import { getMe, login, register } from "../controllers/auth.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";
import { authenticationRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/register", authenticationRateLimiter, registerValidator, validateRequest, register);
router.post("/login", authenticationRateLimiter, loginValidator, validateRequest, login);
router.get("/me", authenticate, getMe);

export default router;
