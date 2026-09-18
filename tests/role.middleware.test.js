import { describe, expect, test } from "@jest/globals";
import authorizeRoles from "../src/middleware/role.middleware.js";

const runMiddleware = (req) => new Promise((resolve) => {
  authorizeRoles("ADMIN")(req, {}, (error) => resolve(error));
});

describe("role authorization middleware", () => {
  test("returns 401 when authentication has not run", async () => {
    const error = await runMiddleware({});
    expect(error.statusCode).toBe(401);
  });

  test("returns 403 for a USER accessing an ADMIN-only action", async () => {
    const error = await runMiddleware({ user: { id: "user-id", role: "USER" } });
    expect(error.statusCode).toBe(403);
  });

  test("allows an ADMIN", async () => {
    await expect(runMiddleware({ user: { id: "admin-id", role: "ADMIN" } })).resolves.toBeUndefined();
  });
});
