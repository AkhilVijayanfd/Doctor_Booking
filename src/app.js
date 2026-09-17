import express from "express";
import helmet from "helmet";
import cors from "cors";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Booking API is running",
  });
});

app.use(errorHandler);

export default app;
