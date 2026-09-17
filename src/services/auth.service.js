import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UniqueConstraintError } from "sequelize";
import env from "../config/env.js";
import { User } from "../models/index.js";
import AppError from "../utils/app-error.js";

const BCRYPT_SALT_ROUNDS = 12;
const userAttributes = ["id", "name", "email", "role"];

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const getJwtSecret = () => {
  if (!env.jwt.secret) {
    throw new AppError("Authentication is not configured.", 500);
  }

  return env.jwt.secret;
};

const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ where: { email: normalizedEmail }, attributes: ["id"] });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "USER",
    });

    return serializeUser(user);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new AppError("An account with this email already exists.", 409);
    }

    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = jwt.sign(
    { role: user.role },
    getJwtSecret(),
    { subject: user.id, expiresIn: env.jwt.expiresIn }
  );

  return { token, user: serializeUser(user) };
};

const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, { attributes: userAttributes });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return serializeUser(user);
};

export { getCurrentUser, loginUser, registerUser };
