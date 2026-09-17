import { createClinic, getClinicOrThrow, serializeClinic, updateClinic } from "../services/clinic.service.js";

const create = async (req, res, next) => {
  try {
    const clinic = await createClinic(req.body);
    return res.status(201).json({ success: true, message: "Clinic created successfully", data: clinic });
  } catch (error) {
    return next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const clinic = await getClinicOrThrow();
    return res.status(200).json({ success: true, message: "Clinic retrieved successfully", data: serializeClinic(clinic) });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const clinic = await updateClinic(req.body);
    return res.status(200).json({ success: true, message: "Clinic updated successfully", data: clinic });
  } catch (error) {
    return next(error);
  }
};

export { create, get, update };
