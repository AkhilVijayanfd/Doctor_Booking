import { DateTime } from "luxon";
import { Op } from "sequelize";
import { Appointment, Doctor, DoctorAvailability, DoctorUnavailability } from "../models/index.js";
import { getClinicOrThrow } from "./clinic.service.js";
import AppError from "../utils/app-error.js";

const doctorAttributes = ["id", "name", "specialization", "isActive"];

const toLocalDateTime = (date, time, timezone) => {
  const value = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  if (!value.isValid || value.toISODate() !== date || value.toFormat("HH:mm") !== time.slice(0, 5)) {
    throw new AppError("Date or time is not valid in the clinic timezone", 400);
  }
  return value;
};

const getClinicDate = (date, timezone) => {
  const value = DateTime.fromISO(date, { zone: timezone });
  if (!value.isValid || value.toISODate() !== date) {
    throw new AppError("date must be a valid YYYY-MM-DD value", 400);
  }
  return value.startOf("day");
};

// Slots are concrete clinic-local schedule instances; retain the clinic offset in the API response.
const serializeSlot = (slot) => ({ startAt: slot.startAt.toISO(), endAt: slot.endAt.toISO() });

const getAvailableSlots = async (doctorId, date, { transaction } = {}) => {
  const clinic = await getClinicOrThrow();
  const timezone = clinic.timezone;
  const clinicDate = getClinicDate(date, timezone);
  const doctor = await Doctor.findByPk(doctorId, { attributes: doctorAttributes, transaction });
  if (!doctor || !doctor.isActive) throw new AppError("Doctor not found", 404);

  // Luxon weekday is 1–7 (Monday–Sunday); persisted schedule uses 0–6 (Sunday–Saturday).
  const dayOfWeek = clinicDate.weekday % 7;
  const availabilities = await DoctorAvailability.findAll({
    where: { doctorId, dayOfWeek }, order: [["startTime", "ASC"]], transaction,
  });
  const dayStart = clinicDate.toUTC().toJSDate();
  const dayEnd = clinicDate.plus({ days: 1 }).toUTC().toJSDate();
  const [unavailabilities, appointments] = await Promise.all([
    DoctorUnavailability.findAll({
      where: { doctorId, startAt: { [Op.lt]: dayEnd }, endAt: { [Op.gt]: dayStart } }, transaction,
    }),
    Appointment.findAll({
      where: { doctorId, status: { [Op.ne]: "CANCELLED" }, startAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } }, transaction,
    }),
  ]);

  const slots = [];
  for (const availability of availabilities) {
    let start = toLocalDateTime(date, availability.startTime, timezone);
    const end = toLocalDateTime(date, availability.endTime, timezone);
    while (start.plus({ minutes: availability.slotDurationMinutes }) <= end) {
      const slotEnd = start.plus({ minutes: availability.slotDurationMinutes });
      slots.push({ startAt: start, endAt: slotEnd });
      start = slotEnd;
    }
  }

  const now = DateTime.utc().toMillis();
  const availableSlots = slots.filter((slot) => {
    const slotStart = slot.startAt.toUTC().toJSDate();
    const slotEnd = slot.endAt.toUTC().toJSDate();
    if (slot.startAt.toUTC().toMillis() <= now) return false;
    if (unavailabilities.some((item) => slotStart < item.endAt && slotEnd > item.startAt)) return false;
    return !appointments.some((item) => item.startAt.getTime() === slotStart.getTime());
  });

  return {
    doctor: { id: doctor.id, name: doctor.name, specialization: doctor.specialization },
    date,
    timezone,
    slots: availableSlots,
  };
};

const getSlotsResponse = async (doctorId, date) => {
  const result = await getAvailableSlots(doctorId, date);
  return { ...result, slots: result.slots.map(serializeSlot) };
};

const parseClinicLocalStart = async (startAt) => {
  const clinic = await getClinicOrThrow();
  const local = DateTime.fromISO(startAt, { zone: clinic.timezone });
  if (!local.isValid || local.toFormat("yyyy-MM-dd'T'HH:mm:ss") !== startAt.slice(0, 19)) {
    throw new AppError("startAt must be valid in the clinic timezone", 400);
  }
  return { date: local.toISODate(), startAt: local.toUTC().toMillis() };
};

export { getAvailableSlots, getSlotsResponse, parseClinicLocalStart, serializeSlot };
