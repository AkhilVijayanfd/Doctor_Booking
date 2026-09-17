import { createDoctor, getDoctorOrThrow, listActiveDoctors, serializeDoctor, updateDoctor } from "../services/doctor.service.js";

const create = async (req, res, next) => {
  try {
    const doctor = await createDoctor(req.body);
    return res.status(201).json({ success: true, message: "Doctor created successfully", data: doctor });
  } catch (error) {
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const doctors = await listActiveDoctors();
    return res.status(200).json({ success: true, message: "Doctors retrieved successfully", data: doctors });
  } catch (error) {
    return next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const doctor = await getDoctorOrThrow(req.params.id);
    return res.status(200).json({ success: true, message: "Doctor retrieved successfully", data: serializeDoctor(doctor) });
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const doctor = await updateDoctor(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Doctor updated successfully", data: doctor });
  } catch (error) {
    return next(error);
  }
};

export { create, get, list, update };
