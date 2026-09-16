import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DoctorUnavailability = sequelize.define(
  "DoctorUnavailability",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: "doctor_id" },
    type: {
      type: DataTypes.ENUM("BREAK", "LEAVE", "OTHER"), allowNull: false,
      validate: { isIn: [["BREAK", "LEAVE", "OTHER"]] },
    },
    startAt: { type: DataTypes.DATE, allowNull: false, field: "start_at" },
    endAt: { type: DataTypes.DATE, allowNull: false, field: "end_at" },
    reason: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: "doctor_unavailabilities", underscored: true, timestamps: true,
    validate: {
      startAtBeforeEndAt() {
        if (this.startAt >= this.endAt) throw new Error("startAt must be before endAt");
      },
    },
  }
);

export default DoctorUnavailability;
