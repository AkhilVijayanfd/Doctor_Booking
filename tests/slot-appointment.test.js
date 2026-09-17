import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

const jwtSecret = "phase-6-test-jwt-secret";
let app;
let Clinic;
let Doctor;
let DoctorAvailability;
let DoctorUnavailability;
let Appointment;
let User;
let sequelize;
let clinicId;
let createdClinic;
let doctorId;
let userId;
let otherUserId;
let userToken;
let otherUserToken;
let adminToken;
let date;
let localStart;
let firstThursday;
let secondThursday;

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  ({ default: app } = await import("../src/app.js"));
  ({ Appointment, Clinic, Doctor, DoctorAvailability, DoctorUnavailability, User } = await import("../src/models/index.js"));
  ({ default: sequelize } = await import("../src/config/database.js"));

  const existingClinic = await Clinic.findOne({ order: [["createdAt", "ASC"]] });
  const clinic = existingClinic ?? await Clinic.create({ name: `Slot Clinic ${randomUUID()}`, timezone: "Asia/Kolkata" });
  clinicId = clinic.id;
  createdClinic = !existingClinic;
  const now = DateTime.now().setZone(clinic.timezone);
  date = now.plus({ days: ((8 - now.weekday) % 7) || 7 }).toISODate();
  localStart = `${date}T09:00:00`;
  firstThursday = now.plus({ days: ((4 - now.weekday + 7) % 7) || 7 }).toISODate();
  secondThursday = DateTime.fromISO(firstThursday, { zone: clinic.timezone }).plus({ days: 7 }).toISODate();

  const doctor = await Doctor.create({ name: "Dr. Slots", specialization: "Cardiology", email: `slots-${randomUUID()}@example.com` });
  doctorId = doctor.id;
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const user = await User.create({ name: "Slot User", email: `slot-user-${randomUUID()}@example.com`, passwordHash, role: "USER" });
  const otherUser = await User.create({ name: "Other Slot User", email: `slot-other-${randomUUID()}@example.com`, passwordHash, role: "USER" });
  userId = user.id;
  otherUserId = otherUser.id;
  userToken = jwt.sign({ role: "USER" }, jwtSecret, { subject: userId, expiresIn: "1h" });
  otherUserToken = jwt.sign({ role: "USER" }, jwtSecret, { subject: otherUserId, expiresIn: "1h" });
  adminToken = jwt.sign({ role: "ADMIN" }, jwtSecret, { subject: randomUUID(), expiresIn: "1h" });

  await DoctorAvailability.create({ doctorId, dayOfWeek: 1, startTime: "09:00", endTime: "11:00", slotDurationMinutes: 30 });
  await DoctorAvailability.create({ doctorId, dayOfWeek: 4, startTime: "09:00", endTime: "10:00", slotDurationMinutes: 30 });
  const localBreakStart = DateTime.fromISO(`${date}T09:30:00`, { zone: clinic.timezone }).toUTC().toJSDate();
  const localBreakEnd = DateTime.fromISO(`${date}T10:30:00`, { zone: clinic.timezone }).toUTC().toJSDate();
  await DoctorUnavailability.create({ doctorId, type: "BREAK", startAt: localBreakStart, endAt: localBreakEnd });
  const bookedStart = DateTime.fromISO(`${date}T10:30:00`, { zone: clinic.timezone }).toUTC().toJSDate();
  const bookedEnd = DateTime.fromISO(`${date}T11:00:00`, { zone: clinic.timezone }).toUTC().toJSDate();
  await Appointment.create({ doctorId, userId, startAt: bookedStart, endAt: bookedEnd, status: "BOOKED" });
});

afterAll(async () => {
  if (doctorId) {
    await Appointment.destroy({ where: { doctorId } });
    await DoctorAvailability.destroy({ where: { doctorId } });
    await DoctorUnavailability.destroy({ where: { doctorId } });
    await Doctor.destroy({ where: { id: doctorId } });
  }
  if (userId || otherUserId) await User.destroy({ where: { id: [userId, otherUserId].filter(Boolean) } });
  if (createdClinic && clinicId) await Clinic.destroy({ where: { id: clinicId } });
  await sequelize?.close();
});

describe("slot generation and appointment booking", () => {
  test("returns only non-past, non-break, non-booked clinic-local slots", async () => {
    const response = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.objectContaining({ date, doctor: expect.objectContaining({ id: doctorId }) }));
    expect(response.body.data.slots).toHaveLength(1);
    expect(response.body.data.slots[0].startAt).toBe(DateTime.fromISO(localStart, { zone: response.body.data.timezone }).toISO());
  });

  test("applies one recurring Thursday rule only to each requested Thursday", async () => {
    const first = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date: firstThursday });
    const second = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date: secondThursday });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.slots).toHaveLength(2);
    expect(second.body.data.slots).toHaveLength(2);
    expect(first.body.data.slots.every((slot) => slot.startAt.startsWith(firstThursday))).toBe(true);
    expect(second.body.data.slots.every((slot) => slot.startAt.startsWith(secondThursday))).toBe(true);
    expect(first.body.data.slots.some((slot) => slot.startAt.startsWith(secondThursday))).toBe(false);
    expect(second.body.data.slots.some((slot) => slot.startAt.startsWith(firstThursday))).toBe(false);
  });

  test("applies unavailability and appointments only to their concrete Thursday", async () => {
    const clinic = await Clinic.findByPk(clinicId);
    const breakStart = DateTime.fromISO(`${firstThursday}T09:00:00`, { zone: clinic.timezone }).toUTC().toJSDate();
    const breakEnd = DateTime.fromISO(`${firstThursday}T09:30:00`, { zone: clinic.timezone }).toUTC().toJSDate();
    await DoctorUnavailability.create({ doctorId, type: "BREAK", startAt: breakStart, endAt: breakEnd });
    const appointmentStart = DateTime.fromISO(`${firstThursday}T09:30:00`, { zone: clinic.timezone }).toUTC().toJSDate();
    const appointmentEnd = DateTime.fromISO(`${firstThursday}T10:00:00`, { zone: clinic.timezone }).toUTC().toJSDate();
    await Appointment.create({ doctorId, userId, startAt: appointmentStart, endAt: appointmentEnd, status: "BOOKED" });

    const first = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date: firstThursday });
    const second = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date: secondThursday });
    expect(first.body.data.slots).toHaveLength(0);
    expect(second.body.data.slots).toHaveLength(2);
  });

  test("validates slot lookup input and rejects inactive doctors", async () => {
    const invalidDate = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date: "invalid" });
    expect(invalidDate.status).toBe(400);
    await Doctor.update({ isActive: false }, { where: { id: doctorId } });
    const inactive = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date });
    expect(inactive.status).toBe(404);
    await Doctor.update({ isActive: true }, { where: { id: doctorId } });
  });

  test("books only an exact available slot and hides it afterwards", async () => {
    const noToken = await request(app).post("/api/appointments").send({ doctorId, startAt: localStart });
    const admin = await request(app).post("/api/appointments").set("Authorization", `Bearer ${adminToken}`).send({ doctorId, startAt: localStart });
    const arbitrary = await request(app).post("/api/appointments").set("Authorization", `Bearer ${userToken}`).send({ doctorId, startAt: `${date}T09:15:00` });
    expect(noToken.status).toBe(401);
    expect(admin.status).toBe(403);
    expect(arbitrary.status).toBe(409);

    const booked = await request(app).post("/api/appointments").set("Authorization", `Bearer ${userToken}`).send({ doctorId, startAt: localStart });
    expect(booked.status).toBe(201);
    expect(booked.body.data).toEqual(expect.objectContaining({ status: "BOOKED", doctor: expect.objectContaining({ id: doctorId }) }));
    const appointmentId = booked.body.data.id;

    const duplicate = await request(app).post("/api/appointments").set("Authorization", `Bearer ${userToken}`).send({ doctorId, startAt: localStart });
    expect(duplicate.status).toBe(409);
    const slots = await request(app).get(`/api/doctors/${doctorId}/slots`).query({ date });
    expect(slots.body.data.slots).toHaveLength(0);

    const mine = await request(app).get("/api/appointments").set("Authorization", `Bearer ${userToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.some((item) => item.id === appointmentId)).toBe(true);
    const own = await request(app).get(`/api/appointments/${appointmentId}`).set("Authorization", `Bearer ${userToken}`);
    const other = await request(app).get(`/api/appointments/${appointmentId}`).set("Authorization", `Bearer ${otherUserToken}`);
    expect(own.status).toBe(200);
    expect(other.status).toBe(404);
  });
});
