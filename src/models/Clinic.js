import { DataTypes } from "sequelize";
import { DateTime } from "luxon";
import sequelize from "../config/database.js";

const Clinic = sequelize.define(
  "Clinic",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(160), allowNull: false, validate: { notEmpty: true, len: [1, 160] } },
    timezone: {
      type: DataTypes.STRING(100), allowNull: false,
      validate: {
        isIanaTimezone(value) {
          if (!DateTime.now().setZone(value).isValid) {
            throw new Error("timezone must be a valid IANA timezone");
          }
        },
      },
    },
  },
  { tableName: "clinics", underscored: true, timestamps: true }
);

export default Clinic;
