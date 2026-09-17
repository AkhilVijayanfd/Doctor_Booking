import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

const jwtSecret = "phase-5-test-jwt-secret";
const adminToken = jwt.sign({ role: "ADMIN" }, jwtSecret, { subject: randomUUID(), expiresIn: "1h" });
const userToken = jwt.sign({ role: "USER" }, jwtSecret, { subject: randomUUID(), expiresIn: "1h" });
let app;
let Clinic;
let Doctor;
let DoctorAvailability;
let DoctorUnavailability;
let sequelize;
let clinicId;
let createdClinic;
let doctorId;
let otherDoctorId;
let availabilityId;
let secondAvailabilityId;
let unavailabilityId;
let leaveId;
let otherId;

const adminRequest = () => ({
  post: (path) => request(app).post(path).set("Authorization", `Bearer ${adminToken}`),
  get: (path) => request(app).get(path).set("Authorization", `Bearer ${adminToken}`),
  put: (path) => request(app).put(path).set("Authorization", `Bearer ${adminToken}`),
  delete: (path) => request(app).delete(path).set("Authorization", `Bearer ${adminToken}`),
});

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  ({ default: app } = await import("../src/app.js"));
  ({ Clinic, Doctor, DoctorAvailability, DoctorUnavailability } = await import("../src/models/index.js"));
  ({ default: sequelize } = await import("../src/config/database.js"));

  const existingClinic = await Clinic.findOne({ order: [["createdAt", "ASC"]] });
  const clinic = existingClinic ?? await Clinic.create({ name: `Availability Clinic ${randomUUID()}`, timezone: "Asia/Kolkata" });
  clinicId = clinic.id;
  createdClinic = !existingClinic;
  const doctor = await Doctor.create({ name: "Dr. Availability", specialization: "General Medicine", email: `availability-${randomUUID()}@example.com` });
  const otherDoctor = await Doctor.create({ name: "Dr. Other", specialization: "General Medicine", email: `availability-other-${randomUUID()}@example.com` });
  doctorId = doctor.id;
  otherDoctorId = otherDoctor.id;
});

afterAll(async () => {
  if (doctorId || otherDoctorId) {
    const doctorIds = [doctorId, otherDoctorId].filter(Boolean);
    await DoctorAvailability.destroy({ where: { doctorId: doctorIds } });
    await DoctorUnavailability.destroy({ where: { doctorId: doctorIds } });
    await Doctor.destroy({ where: { id: doctorIds } });
  }
  if (createdClinic && clinicId) await Clinic.destroy({ where: { id: clinicId } });
  await sequelize?.close();
});

describe("doctor availability API", () => {
  test("requires an ADMIN token", async () => {
    const payload = { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 };
    const noToken = await request(app).post(`/api/admin/doctors/${doctorId}/availability`).send(payload);
    const user = await request(app).post(`/api/admin/doctors/${doctorId}/availability`).set("Authorization", `Bearer ${userToken}`).send(payload);

    expect(noToken.status).toBe(401);
    expect(user.status).toBe(403);
  });

  test("validates availability values and creates non-overlapping recurring periods", async () => {
    const invalidDay = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 8, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 });
    const invalidTime = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "09:00", endTime: "09:00", slotDurationMinutes: 30 });
    const invalidDuration = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "09:00", endTime: "13:00", slotDurationMinutes: -30 });
    const unevenDuration = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "09:00", endTime: "10:00", slotDurationMinutes: 45 });
    expect(invalidDay.status).toBe(400);
    expect(invalidTime.status).toBe(400);
    expect(invalidDuration.status).toBe(400);
    expect(unevenDuration.status).toBe(400);

    const first = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 });
    const second = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "14:00", endTime: "17:00", slotDurationMinutes: 30 });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data).toEqual(expect.objectContaining({ doctorId, dayOfWeek: 1, startTime: "09:00", endTime: "13:00" }));
    availabilityId = first.body.data.id;
    secondAvailabilityId = second.body.data.id;

    const overlap = await adminRequest().post(`/api/admin/doctors/${doctorId}/availability`).send({ dayOfWeek: 1, startTime: "12:00", endTime: "15:00", slotDurationMinutes: 30 });
    expect(overlap.status).toBe(409);
  });

  test("lists, updates, isolates ownership, and deletes availability", async () => {
    const listed = await adminRequest().get(`/api/admin/doctors/${doctorId}/availability`);
    expect(listed.status).toBe(200);
    expect(listed.body.data.map((item) => item.id)).toEqual([availabilityId, secondAvailabilityId]);

    const updated = await adminRequest().put(`/api/admin/doctors/${doctorId}/availability/${availabilityId}`).send({ endTime: "12:00" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.endTime).toBe("12:00");

    const wrongDoctor = await adminRequest().put(`/api/admin/doctors/${otherDoctorId}/availability/${availabilityId}`).send({ endTime: "11:00" });
    expect(wrongDoctor.status).toBe(404);

    const deleted = await adminRequest().delete(`/api/admin/doctors/${doctorId}/availability/${secondAvailabilityId}`);
    expect(deleted.status).toBe(200);
    const afterDelete = await adminRequest().get(`/api/admin/doctors/${doctorId}/availability`);
    expect(afterDelete.body.data.map((item) => item.id)).toEqual([availabilityId]);
  });
});

describe("doctor unavailability API", () => {
  test("validates input and requires an ADMIN token", async () => {
    const payload = { type: "BREAK", startAt: "2026-09-20T13:00:00", endAt: "2026-09-20T14:00:00" };
    const noToken = await request(app).post(`/api/admin/doctors/${doctorId}/unavailability`).send(payload);
    const user = await request(app).post(`/api/admin/doctors/${doctorId}/unavailability`).set("Authorization", `Bearer ${userToken}`).send(payload);
    const invalidType = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({ ...payload, type: "INVALID" });
    const invalidRange = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({ ...payload, endAt: "2026-09-20T13:00:00" });
    const invalidDate = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({ ...payload, startAt: "not-a-date" });
    expect(noToken.status).toBe(401);
    expect(user.status).toBe(403);
    expect(invalidType.status).toBe(400);
    expect(invalidRange.status).toBe(400);
    expect(invalidDate.status).toBe(400);
  });

  test("converts clinic-local input to UTC and prevents overlaps", async () => {
    const created = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({
      type: "BREAK", startAt: "2026-09-20T13:00:00", endAt: "2026-09-20T14:00:00", reason: "Lunch break",
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toEqual(expect.objectContaining({ type: "BREAK", startAt: "2026-09-20T07:30:00.000Z", endAt: "2026-09-20T08:30:00.000Z" }));
    unavailabilityId = created.body.data.id;

    const overlap = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({
      type: "BREAK", startAt: "2026-09-20T13:30:00", endAt: "2026-09-20T15:00:00",
    });
    expect(overlap.status).toBe(409);

    const leave = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({
      type: "LEAVE", startAt: "2026-09-20T15:00:00", endAt: "2026-09-20T16:00:00",
    });
    const other = await adminRequest().post(`/api/admin/doctors/${doctorId}/unavailability`).send({
      type: "OTHER", startAt: "2026-09-20T16:00:00", endAt: "2026-09-20T17:00:00",
    });
    expect(leave.status).toBe(201);
    expect(other.status).toBe(201);
    leaveId = leave.body.data.id;
    otherId = other.body.data.id;
  });

  test("lists, updates, isolates ownership, and deletes unavailability", async () => {
    const listed = await adminRequest().get(`/api/admin/doctors/${doctorId}/unavailability`);
    expect(listed.status).toBe(200);
    expect(listed.body.data.map((item) => item.id)).toEqual([unavailabilityId, leaveId, otherId]);

    const updated = await adminRequest().put(`/api/admin/doctors/${doctorId}/unavailability/${unavailabilityId}`).send({ reason: "Updated lunch" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.reason).toBe("Updated lunch");

    const wrongDoctor = await adminRequest().put(`/api/admin/doctors/${otherDoctorId}/unavailability/${unavailabilityId}`).send({ type: "OTHER" });
    expect(wrongDoctor.status).toBe(404);

    const deleted = await adminRequest().delete(`/api/admin/doctors/${doctorId}/unavailability/${otherId}`);
    expect(deleted.status).toBe(200);
    const afterDelete = await adminRequest().get(`/api/admin/doctors/${doctorId}/unavailability`);
    expect(afterDelete.body.data.map((item) => item.id)).toEqual([unavailabilityId, leaveId]);
  });
});
