import { bookAppointment, getUserAppointment, listUserAppointments } from "../services/appointment.service.js";

const create = async (req, res, next) => {
  try {
    const appointment = await bookAppointment(req.user.id, req.body);
    return res.status(201).json({ success: true, message: "Appointment booked successfully", data: appointment });
  } catch (error) {
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const appointments = await listUserAppointments(req.user.id);
    return res.status(200).json({ success: true, message: "Appointments retrieved successfully", data: appointments });
  } catch (error) {
    return next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const appointment = await getUserAppointment(req.user.id, req.params.id);
    return res.status(200).json({ success: true, message: "Appointment retrieved successfully", data: appointment });
  } catch (error) {
    return next(error);
  }
};

export { create, get, list };
