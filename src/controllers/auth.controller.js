import { getCurrentUser, loginUser, registerUser } from "../services/auth.service.js";

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({ success: true, message: "User registered successfully", data: user });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body);
    return res.status(200).json({ success: true, message: "Login successful", data });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

export { getMe, login, register };
