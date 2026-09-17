import { UniqueConstraintError } from "sequelize";
import sequelize from "../config/database.js";
import { Appointment, Doctor } from "../models/index.js";
import AppError from "../utils/app-error.js";
import { getAvailableSlots, parseClinicLocalStart } from "./slot.service.js";

const appointmentInclude = [{ model: Doctor, as: "doctor", attributes: ["id", "name", "specialization"] }];

const serializeAppointment = (appointment) => ({
  id: appointment.id,
  doctor: appointment.doctor ? { id: appointment.doctor.id, name: appointment.doctor.name, specialization: appointment.doctor.specialization } : undefined,
  startAt: appointment.startAt.toISOString(),
  endAt: appointment.endAt.toISOString(),
  status: appointment.status,
});

const slotUnavailable = () => new AppError("Selected appointment slot is no longer available.", 409);

const bookAppointment = async (userId, { doctorId, startAt }) => {
  const requested = await parseClinicLocalStart(startAt);
  try {
    const appointment = await sequelize.transaction(async (transaction) => {
      const schedule = await getAvailableSlots(doctorId, requested.date, { transaction });
      const slot = schedule.slots.find((item) => item.startAt.toUTC().toMillis() === requested.startAt);
      if (!slot) throw slotUnavailable();
      return Appointment.create({
        doctorId,
        userId,
        startAt: slot.startAt.toUTC().toJSDate(),
        endAt: slot.endAt.toUTC().toJSDate(),
        status: "BOOKED",
      }, { transaction });
    });
    const withDoctor = await Appointment.findByPk(appointment.id, { include: appointmentInclude });
    return serializeAppointment(withDoctor);
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw slotUnavailable();
    throw error;
  }
};

const listUserAppointments = async (userId) => {
  const appointments = await Appointment.findAll({
    where: { userId }, include: appointmentInclude, order: [["startAt", "ASC"]],
  });
  return appointments.map(serializeAppointment);
};

const getUserAppointment = async (userId, appointmentId) => {
  const appointment = await Appointment.findOne({ where: { id: appointmentId, userId }, include: appointmentInclude });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return serializeAppointment(appointment);
};

export { bookAppointment, getUserAppointment, listUserAppointments };
