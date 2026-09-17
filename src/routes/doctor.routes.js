import { Router } from "express";
import { create, get, list, update } from "../controllers/doctor.controller.js";
import authenticate from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/role.middleware.js";
import validateRequest from "../middleware/validation.middleware.js";
import { createDoctorValidator, doctorIdValidator, updateDoctorValidator } from "../validators/doctor.validator.js";

const adminRouter = Router();
const publicRouter = Router();

adminRouter.use(authenticate, authorizeRoles("ADMIN"));
adminRouter.post("/doctors", createDoctorValidator, validateRequest, create);
adminRouter.put("/doctors/:id", updateDoctorValidator, validateRequest, update);

publicRouter.get("/doctors", list);
publicRouter.get("/doctors/:id", doctorIdValidator, validateRequest, get);

export { adminRouter, publicRouter };
