import { Router } from "express";
import { create, get, list } from "../controllers/appointment.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import { appointmentIdValidator, bookAppointmentValidator } from "../validators/slot.validator.js";
import { bookingRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("USER"));
router.post("/", bookingRateLimiter, bookAppointmentValidator, validateRequest, create);
router.get("/", list);
router.get("/:id", appointmentIdValidator, validateRequest, get);

export default router;
