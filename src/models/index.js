import Appointment from "./Appointment.js";
import Clinic from "./Clinic.js";
import Doctor from "./Doctor.js";
import DoctorAvailability from "./DoctorAvailability.js";
import DoctorUnavailability from "./DoctorUnavailability.js";
import User from "./User.js";

User.hasMany(Appointment, { foreignKey: "userId", as: "appointments", onDelete: "RESTRICT", onUpdate: "CASCADE" });
Doctor.hasMany(DoctorAvailability, { foreignKey: "doctorId", as: "availabilities", onDelete: "RESTRICT", onUpdate: "CASCADE" });
Doctor.hasMany(DoctorUnavailability, { foreignKey: "doctorId", as: "unavailabilities", onDelete: "RESTRICT", onUpdate: "CASCADE" });
Doctor.hasMany(Appointment, { foreignKey: "doctorId", as: "appointments", onDelete: "RESTRICT", onUpdate: "CASCADE" });
DoctorAvailability.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
DoctorUnavailability.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });
Appointment.belongsTo(User, { foreignKey: "userId", as: "user" });
Appointment.belongsTo(Doctor, { foreignKey: "doctorId", as: "doctor" });

export { Appointment, Clinic, Doctor, DoctorAvailability, DoctorUnavailability, User };
