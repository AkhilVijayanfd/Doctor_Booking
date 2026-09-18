import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

const jwtSecret = "test-jwt-secret-only-not-for-production";
const email = `auth-test-${randomUUID()}@example.com`;
const password = "Password@123";
let app;
let User;
let sequelize;
let createdUserId;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  process.env.JWT_EXPIRES_IN = "1h";

  ({ default: app } = await import("../src/app.js"));
  ({ User } = await import("../src/models/index.js"));
  ({ default: sequelize } = await import("../src/config/database.js"));
});

afterAll(async () => {
  if (User) {
    await User.destroy({ where: { email } });
  }
  await sequelize?.close();
});

describe("authentication API", () => {
  test("registers only a USER, stores a bcrypt hash, and omits passwordHash", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Auth Test User",
      email: email.toUpperCase(),
      password,
      role: "ADMIN",
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(expect.objectContaining({ email, role: "USER" }));
    expect(response.body.data.passwordHash).toBeUndefined();
    expect(response.body.data.password_hash).toBeUndefined();

    const user = await User.findOne({ where: { email } });
    createdUserId = user.id;
    expect(user.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
  });

  test("rejects invalid registration data and duplicate emails", async () => {
    const invalid = await request(app).post("/api/auth/register").send({ name: "", email: "not-an-email", password: "weak" });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual(expect.objectContaining({ success: false, message: "Validation failed" }));

    const duplicate = await request(app).post("/api/auth/register").send({ name: "Duplicate", email, password });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe("An account with this email already exists.");
  });

  test("logs in with valid credentials and uses a generic failure response", async () => {
    const login = await request(app).post("/api/auth/login").send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toEqual(expect.any(String));
    expect(jwt.verify(login.body.data.token, jwtSecret)).toEqual(expect.objectContaining({ sub: createdUserId, role: "USER" }));
    token = login.body.data.token;

    const wrongPassword = await request(app).post("/api/auth/login").send({ email, password: "WrongPassword@123" });
    const unknownEmail = await request(app).post("/api/auth/login").send({ email: `unknown-${randomUUID()}@example.com`, password });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe("Invalid email or password.");
    expect(unknownEmail.body.message).toBe("Invalid email or password.");
  });

  test("protects current-user access and returns no password hash", async () => {
    const noToken = await request(app).get("/api/auth/me");
    const malformed = await request(app).get("/api/auth/me").set("Authorization", "Token value");
    const invalid = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid-token");
    const expiredToken = jwt.sign({ role: "USER" }, jwtSecret, { subject: createdUserId, expiresIn: "0s" });
    const expired = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expiredToken}`);
    const currentUser = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(noToken.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(expired.status).toBe(401);
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.data).toEqual(expect.objectContaining({ id: createdUserId, email, role: "USER" }));
    expect(currentUser.body.data.passwordHash).toBeUndefined();

    await User.destroy({ where: { id: createdUserId } });
    const removedUser = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(removedUser.status).toBe(404);
  });
});
