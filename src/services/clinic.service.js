import { Clinic } from "../models/index.js";
import AppError from "../utils/app-error.js";

const clinicAttributes = ["id", "name", "timezone"];

const serializeClinic = (clinic) => ({
  id: clinic.id,
  name: clinic.name,
  timezone: clinic.timezone,
});

const getClinic = async () => Clinic.findOne({
  attributes: clinicAttributes,
  order: [["createdAt", "ASC"]],
});

const createClinic = async ({ name, timezone }) => {
  const existingClinic = await getClinic();

  if (existingClinic) {
    throw new AppError("Clinic already exists.", 409);
  }

  const clinic = await Clinic.create({ name, timezone });
  return serializeClinic(clinic);
};

const getClinicOrThrow = async () => {
  const clinic = await getClinic();

  if (!clinic) {
    throw new AppError("Clinic not found", 404);
  }

  return clinic;
};

const updateClinic = async ({ name, timezone }) => {
  const clinic = await getClinicOrThrow();
  await clinic.update({ name, timezone });
  return serializeClinic(clinic);
};

export { createClinic, getClinicOrThrow, serializeClinic, updateClinic };
