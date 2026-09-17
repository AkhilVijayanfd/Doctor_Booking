import { DateTime } from "luxon";
import { Op } from "sequelize";
import { Doctor, DoctorAvailability, DoctorUnavailability } from "../models/index.js";
import { getClinicOrThrow } from "./clinic.service.js";
import AppError from "../utils/app-error.js";

const timeValue = (time) => time.slice(0, 5);
const serializeAvailability = (value) => ({ id: value.id, doctorId: value.doctorId, dayOfWeek: value.dayOfWeek, startTime: timeValue(value.startTime), endTime: timeValue(value.endTime), slotDurationMinutes: value.slotDurationMinutes });
const serializeUnavailability = (value) => ({ id: value.id, doctorId: value.doctorId, type: value.type, startAt: value.startAt.toISOString(), endAt: value.endAt.toISOString(), reason: value.reason });

const findDoctor = async (doctorId, activeOnly = false) => {
  const doctor = await Doctor.findByPk(doctorId, { attributes: ["id", "isActive"] });
  if (!doctor || (activeOnly && !doctor.isActive)) throw new AppError("Doctor not found", 404);
  return doctor;
};

const minutesBetween = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
};

const validateAvailability = ({ startTime, endTime, slotDurationMinutes }) => {
  const periodMinutes = minutesBetween(startTime, endTime);
  if (periodMinutes <= 0) throw new AppError("endTime must be after startTime", 400);
  // Phase 5 stores only periods that can produce complete slots in Phase 6.
  if (periodMinutes % slotDurationMinutes !== 0) throw new AppError("slotDurationMinutes must divide the availability period evenly", 400);
};

const checkAvailabilityOverlap = async ({ doctorId, dayOfWeek, startTime, endTime, excludeId }) => {
  const where = { doctorId, dayOfWeek, startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await DoctorAvailability.findOne({ where, attributes: ["id"] })) throw new AppError("Doctor availability overlaps an existing period", 409);
};

const createAvailability = async (doctorId, payload) => {
  await findDoctor(doctorId, true);
  validateAvailability(payload);
  await checkAvailabilityOverlap({ doctorId, ...payload });
  return serializeAvailability(await DoctorAvailability.create({ doctorId, ...payload }));
};

const listAvailability = async (doctorId) => {
  await findDoctor(doctorId);
  const records = await DoctorAvailability.findAll({ where: { doctorId }, order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]] });
  return records.map(serializeAvailability);
};

const findAvailability = async (doctorId, availabilityId) => {
  const record = await DoctorAvailability.findOne({ where: { id: availabilityId, doctorId } });
  if (!record) throw new AppError("Doctor availability not found", 404);
  return record;
};

const updateAvailability = async (doctorId, availabilityId, payload) => {
  await findDoctor(doctorId);
  const record = await findAvailability(doctorId, availabilityId);
  const values = {
    dayOfWeek: payload.dayOfWeek ?? record.dayOfWeek,
    startTime: payload.startTime ?? timeValue(record.startTime),
    endTime: payload.endTime ?? timeValue(record.endTime),
    slotDurationMinutes: payload.slotDurationMinutes ?? record.slotDurationMinutes,
  };
  validateAvailability(values);
  await checkAvailabilityOverlap({ doctorId, ...values, excludeId: availabilityId });
  await record.update(values);
  return serializeAvailability(record);
};

const deleteAvailability = async (doctorId, availabilityId) => {
  await findDoctor(doctorId);
  await (await findAvailability(doctorId, availabilityId)).destroy();
};

// Local, offset-free API input is resolved with the clinic IANA zone, then stored as a UTC instant.
const clinicLocalToUtc = (value, timezone) => {
  const dateTime = DateTime.fromISO(value, { zone: timezone });
  if (!dateTime.isValid) throw new AppError("Date-time must be valid in the clinic timezone", 400);
  return dateTime.toUTC().toJSDate();
};

const checkUnavailabilityWindow = (startAt, endAt) => {
  if (startAt >= endAt) throw new AppError("endAt must be after startAt", 400);
};

const checkUnavailabilityOverlap = async ({ doctorId, startAt, endAt, excludeId }) => {
  const where = { doctorId, startAt: { [Op.lt]: endAt }, endAt: { [Op.gt]: startAt } };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await DoctorUnavailability.findOne({ where, attributes: ["id"] })) throw new AppError("Doctor unavailability overlaps an existing period", 409);
};

const getTimezone = async () => (await getClinicOrThrow()).timezone;

const createUnavailability = async (doctorId, payload) => {
  await findDoctor(doctorId, true);
  const timezone = await getTimezone();
  const startAt = clinicLocalToUtc(payload.startAt, timezone);
  const endAt = clinicLocalToUtc(payload.endAt, timezone);
  checkUnavailabilityWindow(startAt, endAt);
  await checkUnavailabilityOverlap({ doctorId, startAt, endAt });
  return serializeUnavailability(await DoctorUnavailability.create({ doctorId, type: payload.type, startAt, endAt, reason: payload.reason ?? null }));
};

const listUnavailability = async (doctorId) => {
  await findDoctor(doctorId);
  const records = await DoctorUnavailability.findAll({ where: { doctorId }, order: [["startAt", "ASC"]] });
  return records.map(serializeUnavailability);
};

const findUnavailability = async (doctorId, unavailabilityId) => {
  const record = await DoctorUnavailability.findOne({ where: { id: unavailabilityId, doctorId } });
  if (!record) throw new AppError("Doctor unavailability not found", 404);
  return record;
};

const updateUnavailability = async (doctorId, unavailabilityId, payload) => {
  await findDoctor(doctorId);
  const record = await findUnavailability(doctorId, unavailabilityId);
  const timezone = await getTimezone();
  const startAt = payload.startAt === undefined ? record.startAt : clinicLocalToUtc(payload.startAt, timezone);
  const endAt = payload.endAt === undefined ? record.endAt : clinicLocalToUtc(payload.endAt, timezone);
  checkUnavailabilityWindow(startAt, endAt);
  await checkUnavailabilityOverlap({ doctorId, startAt, endAt, excludeId: unavailabilityId });
  await record.update({ type: payload.type ?? record.type, startAt, endAt, reason: payload.reason === undefined ? record.reason : payload.reason });
  return serializeUnavailability(record);
};

const deleteUnavailability = async (doctorId, unavailabilityId) => {
  await findDoctor(doctorId);
  await (await findUnavailability(doctorId, unavailabilityId)).destroy();
};

export { createAvailability, createUnavailability, deleteAvailability, deleteUnavailability, listAvailability, listUnavailability, updateAvailability, updateUnavailability };
