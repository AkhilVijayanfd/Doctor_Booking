import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DoctorAvailability = sequelize.define(
  "DoctorAvailability",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: "doctor_id" },
    dayOfWeek: { type: DataTypes.SMALLINT, allowNull: false, field: "day_of_week", validate: { min: 0, max: 6, isInt: true } },
    startTime: { type: DataTypes.TIME, allowNull: false, field: "start_time" },
    endTime: { type: DataTypes.TIME, allowNull: false, field: "end_time" },
    slotDurationMinutes: { type: DataTypes.INTEGER, allowNull: false, field: "slot_duration_minutes", validate: { isInt: true, min: 1 } },
  },
  {
    tableName: "doctor_availabilities", underscored: true, timestamps: true,
    validate: {
      startTimeBeforeEndTime() {
        if (this.startTime >= this.endTime) throw new Error("startTime must be before endTime");
      },
    },
  }
);

export default DoctorAvailability;
