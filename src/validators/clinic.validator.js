import { body } from "express-validator";

const isIanaTimezone = (value) => {
  if (!/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)*$/.test(value)) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const clinicFields = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 160 }).withMessage("Name must be at most 160 characters long"),
  body("timezone").trim().notEmpty().withMessage("Timezone is required").custom(isIanaTimezone).withMessage("Timezone must be a valid IANA timezone"),
];

const createClinicValidator = clinicFields;
const updateClinicValidator = clinicFields;

export { createClinicValidator, updateClinicValidator };
