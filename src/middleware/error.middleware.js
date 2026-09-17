import { UniqueConstraintError, ValidationError } from "sequelize";

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ success: false, message: "A record with those details already exists." });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }

  const statusCode = error.isOperational ? error.statusCode : 500;
  const message = error.isOperational ? error.message : "Internal server error.";

  return res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
