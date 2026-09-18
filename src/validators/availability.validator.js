import { body, param } from "express-validator";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

const doctorId = () => param("doctorId").isUUID().withMessage("Doctor id must be a valid UUID");
const availabilityId = () => param("availabilityId").isUUID().withMessage("Availability id must be a valid UUID");
const unavailabilityId = () => param("unavailabilityId").isUUID().withMessage("Unavailability id must be a valid UUID");
const localDateTime = (field, required = false) => {
  const validator = body(field);
  if (!required) validator.optional();
  return validator.isString().withMessage(`${field} must be a string`)
    .matches(localDateTimePattern).withMessage(`${field} must be an ISO local date-time without an offset`);
};

const availabilityFields = [
  body("dayOfWeek").optional().isInt({ min: 0, max: 6 }).withMessage("dayOfWeek must be an integer between 0 and 6").toInt(),
  body("startTime").optional().isString().withMessage("startTime must be a string").matches(timePattern).withMessage("startTime must use HH:mm format"),
  body("endTime").optional().isString().withMessage("endTime must be a string").matches(timePattern).withMessage("endTime must use HH:mm format"),
  body("slotDurationMinutes").optional().isInt({ min: 1 }).withMessage("slotDurationMinutes must be a positive integer").toInt(),
];

const createAvailabilityValidator = [
  doctorId(),
  body("dayOfWeek").isInt({ min: 0, max: 6 }).withMessage("dayOfWeek must be an integer between 0 and 6").toInt(),
  body("startTime").isString().withMessage("startTime must be a string").matches(timePattern).withMessage("startTime must use HH:mm format"),
  body("endTime").isString().withMessage("endTime must be a string").matches(timePattern).withMessage("endTime must use HH:mm format"),
  body("slotDurationMinutes").isInt({ min: 1 }).withMessage("slotDurationMinutes must be a positive integer").toInt(),
];

const updateAvailabilityValidator = [
  doctorId(), availabilityId(), ...availabilityFields,
  body().custom((value) => {
    if (!Object.keys(value).some((key) => ["dayOfWeek", "startTime", "endTime", "slotDurationMinutes"].includes(key))) throw new Error("At least one availability field must be provided");
    return true;
  }),
];

const unavailabilityFields = [
  body("type").optional().isIn(["BREAK", "LEAVE", "OTHER"]).withMessage("type must be BREAK, LEAVE, or OTHER"),
  localDateTime("startAt"), localDateTime("endAt"),
  body("reason").optional({ nullable: true }).isString().withMessage("reason must be a string").trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters long"),
];

const createUnavailabilityValidator = [
  doctorId(),
  body("type").isIn(["BREAK", "LEAVE", "OTHER"]).withMessage("type must be BREAK, LEAVE, or OTHER"),
  localDateTime("startAt", true), localDateTime("endAt", true),
  body("reason").optional({ nullable: true }).isString().withMessage("reason must be a string").trim().isLength({ max: 500 }).withMessage("reason must be at most 500 characters long"),
];

const updateUnavailabilityValidator = [
  doctorId(), unavailabilityId(), ...unavailabilityFields,
  body().custom((value) => {
    if (!Object.keys(value).some((key) => ["type", "startAt", "endAt", "reason"].includes(key))) throw new Error("At least one unavailability field must be provided");
    return true;
  }),
];

const availabilityParamsValidator = [doctorId()];
const availabilityRecordParamsValidator = [doctorId(), availabilityId()];
const unavailabilityParamsValidator = [doctorId()];
const unavailabilityRecordParamsValidator = [doctorId(), unavailabilityId()];

export { availabilityParamsValidator, availabilityRecordParamsValidator, createAvailabilityValidator, createUnavailabilityValidator, unavailabilityParamsValidator, unavailabilityRecordParamsValidator, updateAvailabilityValidator, updateUnavailabilityValidator };
