import { getSlotsResponse } from "../services/slot.service.js";

const getSlots = async (req, res, next) => {
  try {
    const slots = await getSlotsResponse(req.params.doctorId, req.query.date);
    return res.status(200).json({ success: true, message: "Available slots fetched successfully", data: slots });
  } catch (error) {
    return next(error);
  }
};

export { getSlots };
