import { Router } from "express";
import { getSlots } from "../controllers/slot.controller.js";
import validateRequest from "../middleware/validation.middleware.js";
import { slotsValidator } from "../validators/slot.validator.js";

const router = Router();

router.get("/doctors/:doctorId/slots", slotsValidator, validateRequest, getSlots);

export default router;
