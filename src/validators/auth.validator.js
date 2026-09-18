import { body } from "express-validator";

const passwordRules = body("password")
  .isString().withMessage("Password is required")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
  .matches(/[a-z]/).withMessage("Password must include a lowercase letter")
  .matches(/[A-Z]/).withMessage("Password must include an uppercase letter")
  .matches(/[0-9]/).withMessage("Password must include a number");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 120 }).withMessage("Name must be at most 120 characters long"),
  body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail({ gmail_remove_dots: false }),
  passwordRules,
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Please provide a valid email").normalizeEmail({ gmail_remove_dots: false }),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

export { loginValidator, registerValidator };
