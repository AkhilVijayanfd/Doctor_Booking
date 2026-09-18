import express from "express";
import helmet from "helmet";
import cors from "cors";
import env from "./config/env.js";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import adminClinicRoutes from "./routes/clinic.routes.js";
import { adminRouter as adminDoctorRoutes, publicRouter as doctorRoutes } from "./routes/doctor.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import slotRoutes from "./routes/slot.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminClinicRoutes);
app.use("/api/admin", adminDoctorRoutes);
app.use("/api/admin", availabilityRoutes);
app.use("/api", doctorRoutes);
app.use("/api", slotRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Booking API is running",
  });
});

app.use(errorHandler);

export default app;
