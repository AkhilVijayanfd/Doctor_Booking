import jwt from "jsonwebtoken";
import env from "../config/env.js";
import AppError from "../utils/app-error.js";

const authenticate = (req, res, next) => {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);

  if (!match) {
    return next(new AppError("Authentication token is required.", 401));
  }

  if (!env.jwt.secret) {
    return next(new AppError("Authentication is not configured.", 500));
  }

  try {
    const payload = jwt.verify(match[1], env.jwt.secret);

    if (!payload.sub || !["ADMIN", "USER"].includes(payload.role)) {
      return next(new AppError("Invalid authentication token.", 401));
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired authentication token.", 401));
  }
};

export default authenticate;
