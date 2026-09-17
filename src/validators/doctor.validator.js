import { body, param } from "express-validator";

const doctorIdValidator = [
  param("id").isUUID().withMessage("Doctor id must be a valid UUID"),
];

const phoneValidator = body("phone")
  .optional({ nullable: true })
  .trim()
  .isLength({ min: 5, max: 30 }).withMessage("Phone must be between 5 and 30 characters long")
  .matches(/^\+?[0-9\s()-]+$/).withMessage("Phone contains invalid characters");

const doctorFields = [
  body("name").optional().isString().withMessage("Name must be a string").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }).withMessage("Name must be at most 120 characters long"),
  body("specialization").optional().isString().withMessage("Specialization must be a string").trim().notEmpty().withMessage("Specialization is required").isLength({ max: 120 }).withMessage("Specialization must be at most 120 characters long"),
  body("email").optional().isString().withMessage("Email must be a string").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail({ gmail_remove_dots: false }),
  phoneValidator,
];

const createDoctorValidator = [
  body("name").isString().withMessage("Name must be a string").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }).withMessage("Name must be at most 120 characters long"),
  body("specialization").isString().withMessage("Specialization must be a string").trim().notEmpty().withMessage("Specialization is required").isLength({ max: 120 }).withMessage("Specialization must be at most 120 characters long"),
  body("email").isString().withMessage("Email must be a string").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail({ gmail_remove_dots: false }),
  phoneValidator,
];

const updateDoctorValidator = [
  ...doctorIdValidator,
  ...doctorFields,
  body("is_active").optional().isBoolean().withMessage("is_active must be a boolean").toBoolean(),
  body().custom((value) => {
    if (!Object.keys(value).some((key) => ["name", "specialization", "email", "phone", "is_active"].includes(key))) {
      throw new Error("At least one doctor field must be provided");
    }
    return true;
  }),
];

export { createDoctorValidator, doctorIdValidator, updateDoctorValidator };
