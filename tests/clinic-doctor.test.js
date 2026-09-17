import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

const jwtSecret = "phase-4-test-jwt-secret";
const adminToken = jwt.sign({ role: "ADMIN" }, jwtSecret, { subject: randomUUID(), expiresIn: "1h" });
const userToken = jwt.sign({ role: "USER" }, jwtSecret, { subject: randomUUID(), expiresIn: "1h" });
const doctorEmail = `doctor-${randomUUID()}@example.com`;
let app;
let Clinic;
let Doctor;
let sequelize;
let clinicId;
let doctorId;

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  ({ default: app } = await import("../src/app.js"));
  ({ Clinic, Doctor } = await import("../src/models/index.js"));
  ({ default: sequelize } = await import("../src/config/database.js"));
});

afterAll(async () => {
  if (doctorId) {
    await Doctor.destroy({ where: { id: doctorId } });
  }
  if (clinicId) {
    await Clinic.destroy({ where: { id: clinicId } });
  }
  await sequelize?.close();
});

describe("clinic management API", () => {
  test("requires ADMIN access for clinic management", async () => {
    const noToken = await request(app).post("/api/admin/clinic").send({ name: "Main Clinic", timezone: "Asia/Kolkata" });
    const user = await request(app).post("/api/admin/clinic").set("Authorization", `Bearer ${userToken}`).send({ name: "Main Clinic", timezone: "Asia/Kolkata" });

    expect(noToken.status).toBe(401);
    expect(user.status).toBe(403);
  });

  test("returns 404 when no clinic has been configured", async () => {
    const response = await request(app).get("/api/admin/clinic").set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });

  test("validates timezone and lets an ADMIN create, retrieve, and update the clinic", async () => {
    const invalidTimezone = await request(app)
      .post("/api/admin/clinic")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Main Clinic", timezone: "IST" });
    expect(invalidTimezone.status).toBe(400);

    const created = await request(app)
      .post("/api/admin/clinic")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Main Clinic", timezone: "Asia/Kolkata" });
    expect(created.status).toBe(201);
    expect(created.body.data).toEqual(expect.objectContaining({ name: "Main Clinic", timezone: "Asia/Kolkata" }));
    clinicId = created.body.data.id;

    const duplicate = await request(app)
      .post("/api/admin/clinic")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Another Clinic", timezone: "Europe/London" });
    expect(duplicate.status).toBe(409);

    const retrieved = await request(app).get("/api/admin/clinic").set("Authorization", `Bearer ${adminToken}`);
    expect(retrieved.status).toBe(200);
    expect(retrieved.body.data.id).toBe(clinicId);

    const userUpdate = await request(app)
      .put("/api/admin/clinic")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Unauthorized Clinic", timezone: "Asia/Kolkata" });
    expect(userUpdate.status).toBe(403);

    const updated = await request(app)
      .put("/api/admin/clinic")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Main Clinic", timezone: "Europe/London" });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toEqual(expect.objectContaining({ name: "Updated Main Clinic", timezone: "Europe/London" }));
  });
});

describe("doctor management API", () => {
  test("requires ADMIN access and validates doctor input", async () => {
    const noToken = await request(app).post("/api/admin/doctors").send({});
    const user = await request(app).post("/api/admin/doctors").set("Authorization", `Bearer ${userToken}`).send({});
    const invalid = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "", specialization: "", email: "invalid", phone: "abc" });

    expect(noToken.status).toBe(401);
    expect(user.status).toBe(403);
    expect(invalid.status).toBe(400);
  });

  test("lets an ADMIN create and update a doctor while preventing duplicate email", async () => {
    const created = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dr. Test", specialization: "Cardiology", email: doctorEmail.toUpperCase(), phone: "+919876543210" });
    expect(created.status).toBe(201);
    expect(created.body.data).toEqual(expect.objectContaining({ email: doctorEmail, is_active: true }));
    doctorId = created.body.data.id;

    const duplicate = await request(app)
      .post("/api/admin/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dr. Duplicate", specialization: "Cardiology", email: doctorEmail });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe("Doctor email already exists");

    const userUpdate = await request(app)
      .put(`/api/admin/doctors/${doctorId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ specialization: "Neurology" });
    expect(userUpdate.status).toBe(403);

    const updated = await request(app)
      .put(`/api/admin/doctors/${doctorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ specialization: "Neurology", is_active: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toEqual(expect.objectContaining({ specialization: "Neurology", is_active: true }));
  });

  test("lists active doctors and hides a deactivated doctor from normal retrieval", async () => {
    const activeList = await request(app).get("/api/doctors").set("Authorization", `Bearer ${userToken}`);
    expect(activeList.status).toBe(200);
    expect(activeList.body.data.some((doctor) => doctor.id === doctorId)).toBe(true);

    const deactivated = await request(app)
      .put(`/api/admin/doctors/${doctorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.is_active).toBe(false);

    const inactiveList = await request(app).get("/api/doctors");
    const inactiveDoctor = await request(app).get(`/api/doctors/${doctorId}`);
    expect(inactiveList.body.data.some((doctor) => doctor.id === doctorId)).toBe(false);
    expect(inactiveDoctor.status).toBe(404);
  });

  test("returns 404 for a missing doctor", async () => {
    const missing = await request(app)
      .put(`/api/admin/doctors/${randomUUID()}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe("Doctor not found");
  });
});
