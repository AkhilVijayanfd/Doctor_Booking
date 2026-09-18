import { Router } from "express";
import {
  createDoctorUnavailability,
  createRecurringAvailability,
  getDoctorUnavailability,
  getRecurringAvailability,
  removeDoctorUnavailability,
  removeRecurringAvailability,
  updateDoctorUnavailability,
  updateRecurringAvailability,
} from "../controllers/availability.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import {
  availabilityParamsValidator,
  availabilityRecordParamsValidator,
  createAvailabilityValidator,
  createUnavailabilityValidator,
  unavailabilityParamsValidator,
  unavailabilityRecordParamsValidator,
  updateAvailabilityValidator,
  updateUnavailabilityValidator,
} from "../validators/availability.validator.js";
import { sensitiveMutationRateLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.post("/doctors/:doctorId/availability", sensitiveMutationRateLimiter, createAvailabilityValidator, validateRequest, createRecurringAvailability);
router.get("/doctors/:doctorId/availability", availabilityParamsValidator, validateRequest, getRecurringAvailability);
router.put("/doctors/:doctorId/availability/:availabilityId", sensitiveMutationRateLimiter, updateAvailabilityValidator, validateRequest, updateRecurringAvailability);
router.delete("/doctors/:doctorId/availability/:availabilityId", sensitiveMutationRateLimiter, availabilityRecordParamsValidator, validateRequest, removeRecurringAvailability);

router.post("/doctors/:doctorId/unavailability", sensitiveMutationRateLimiter, createUnavailabilityValidator, validateRequest, createDoctorUnavailability);
router.get("/doctors/:doctorId/unavailability", unavailabilityParamsValidator, validateRequest, getDoctorUnavailability);
router.put("/doctors/:doctorId/unavailability/:unavailabilityId", sensitiveMutationRateLimiter, updateUnavailabilityValidator, validateRequest, updateDoctorUnavailability);
router.delete("/doctors/:doctorId/unavailability/:unavailabilityId", sensitiveMutationRateLimiter, unavailabilityRecordParamsValidator, validateRequest, removeDoctorUnavailability);

export default router;
