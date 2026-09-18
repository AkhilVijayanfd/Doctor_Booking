import { body, param, query } from "express-validator";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?$/;

const slotsValidator = [
  param("doctorId").isUUID().withMessage("Doctor id must be a valid UUID"),
  query("date").matches(datePattern).withMessage("date must use YYYY-MM-DD format"),
];

const bookAppointmentValidator = [
  body("doctorId").isUUID().withMessage("Doctor id must be a valid UUID"),
  body("startAt").isString().withMessage("startAt must be a string")
    .matches(localDateTimePattern).withMessage("startAt must be an ISO local date-time without an offset"),
];

const appointmentIdValidator = [
  param("id").isUUID().withMessage("Appointment id must be a valid UUID"),
];

export { appointmentIdValidator, bookAppointmentValidator, slotsValidator };
