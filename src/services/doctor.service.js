import { Op, UniqueConstraintError } from "sequelize";
import { Doctor } from "../models/index.js";
import AppError from "../utils/app-error.js";

const doctorAttributes = ["id", "name", "specialization", "email", "phone", "isActive"];

const serializeDoctor = (doctor) => ({
  id: doctor.id,
  name: doctor.name,
  specialization: doctor.specialization,
  email: doctor.email,
  phone: doctor.phone,
  is_active: doctor.isActive,
});

const duplicateEmailError = () => new AppError("Doctor email already exists", 409);

const ensureEmailIsAvailable = async (email, doctorId) => {
  const where = { email };
  if (doctorId) {
    where.id = { [Op.ne]: doctorId };
  }

  const existingDoctor = await Doctor.findOne({ where, attributes: ["id"] });
  if (existingDoctor) {
    throw duplicateEmailError();
  }
};

const createDoctor = async ({ name, specialization, email, phone }) => {
  await ensureEmailIsAvailable(email);

  try {
    const doctor = await Doctor.create({ name, specialization, email, phone: phone ?? null, isActive: true });
    return serializeDoctor(doctor);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw duplicateEmailError();
    }
    throw error;
  }
};

const listActiveDoctors = async () => {
  const doctors = await Doctor.findAll({
    where: { isActive: true },
    attributes: doctorAttributes,
    order: [["name", "ASC"]],
  });
  return doctors.map(serializeDoctor);
};

const getDoctorOrThrow = async (id) => {
  const doctor = await Doctor.findOne({ where: { id, isActive: true }, attributes: doctorAttributes });
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }
  return doctor;
};

const updateDoctor = async (id, payload) => {
  const doctor = await Doctor.findByPk(id);
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  if (payload.email !== undefined) {
    await ensureEmailIsAvailable(payload.email, id);
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.specialization !== undefined) updates.specialization = payload.specialization;
  if (payload.email !== undefined) updates.email = payload.email;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.is_active !== undefined) updates.isActive = payload.is_active;

  try {
    await doctor.update(updates);
    return serializeDoctor(doctor);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw duplicateEmailError();
    }
    throw error;
  }
};

export { createDoctor, getDoctorOrThrow, listActiveDoctors, serializeDoctor, updateDoctor };
