import { Router } from "express";
import { create, get, update } from "../controllers/clinic.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import { createClinicValidator, updateClinicValidator } from "../validators/clinic.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));
router.post("/clinic", createClinicValidator, validateRequest, create);
router.get("/clinic", get);
router.put("/clinic", updateClinicValidator, validateRequest, update);

export default router;
