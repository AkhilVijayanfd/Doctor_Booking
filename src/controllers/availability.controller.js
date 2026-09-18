import {
  createAvailability,
  createUnavailability,
  deleteAvailability,
  deleteUnavailability,
  listAvailability,
  listUnavailability,
  updateAvailability,
  updateUnavailability,
} from "../services/availability.service.js";

const createRecurringAvailability = async (req, res, next) => {
  try {
    const availability = await createAvailability(req.params.doctorId, req.body);
    return res.status(201).json({ success: true, message: "Doctor availability created successfully", data: availability });
  } catch (error) {
    return next(error);
  }
};

const getRecurringAvailability = async (req, res, next) => {
  try {
    const availability = await listAvailability(req.params.doctorId);
    return res.status(200).json({ success: true, message: "Doctor availability retrieved successfully", data: availability });
  } catch (error) {
    return next(error);
  }
};

const updateRecurringAvailability = async (req, res, next) => {
  try {
    const availability = await updateAvailability(req.params.doctorId, req.params.availabilityId, req.body);
    return res.status(200).json({ success: true, message: "Doctor availability updated successfully", data: availability });
  } catch (error) {
    return next(error);
  }
};

const removeRecurringAvailability = async (req, res, next) => {
  try {
    await deleteAvailability(req.params.doctorId, req.params.availabilityId);
    return res.status(200).json({ success: true, message: "Doctor availability deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const createDoctorUnavailability = async (req, res, next) => {
  try {
    const unavailability = await createUnavailability(req.params.doctorId, req.body);
    return res.status(201).json({ success: true, message: "Doctor unavailability created successfully", data: unavailability });
  } catch (error) {
    return next(error);
  }
};

const getDoctorUnavailability = async (req, res, next) => {
  try {
    const unavailability = await listUnavailability(req.params.doctorId);
    return res.status(200).json({ success: true, message: "Doctor unavailability retrieved successfully", data: unavailability });
  } catch (error) {
    return next(error);
  }
};

const updateDoctorUnavailability = async (req, res, next) => {
  try {
    const unavailability = await updateUnavailability(req.params.doctorId, req.params.unavailabilityId, req.body);
    return res.status(200).json({ success: true, message: "Doctor unavailability updated successfully", data: unavailability });
  } catch (error) {
    return next(error);
  }
};

const removeDoctorUnavailability = async (req, res, next) => {
  try {
    await deleteUnavailability(req.params.doctorId, req.params.unavailabilityId);
    return res.status(200).json({ success: true, message: "Doctor unavailability deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export {
  createDoctorUnavailability,
  createRecurringAvailability,
  getDoctorUnavailability,
  getRecurringAvailability,
  removeDoctorUnavailability,
  removeRecurringAvailability,
  updateDoctorUnavailability,
  updateRecurringAvailability,
};
