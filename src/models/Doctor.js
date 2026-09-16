import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Doctor = sequelize.define(
  "Doctor",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true, len: [1, 120] } },
    specialization: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true, len: [1, 120] } },
    email: {
      type: DataTypes.STRING(254), allowNull: true,
      validate: { isEmail: true },
      set(value) { this.setDataValue("email", value?.trim().toLowerCase() || null); },
    },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
  },
  { tableName: "doctors", underscored: true, timestamps: true }
);

export default Doctor;
