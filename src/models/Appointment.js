import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Appointment = sequelize.define(
  "Appointment",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: "doctor_id" },
    userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
    startAt: { type: DataTypes.DATE, allowNull: false, field: "start_at" },
    endAt: { type: DataTypes.DATE, allowNull: false, field: "end_at" },
    status: {
      type: DataTypes.ENUM("BOOKED", "CANCELLED", "COMPLETED"), allowNull: false, defaultValue: "BOOKED",
      validate: { isIn: [["BOOKED", "CANCELLED", "COMPLETED"]] },
    },
  },
  {
    tableName: "appointments", underscored: true, timestamps: true,
    validate: {
      startAtBeforeEndAt() {
        if (this.startAt >= this.endAt) throw new Error("startAt must be before endAt");
      },
    },
  }
);

export default Appointment;
