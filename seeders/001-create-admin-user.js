"use strict";

const bcrypt = require("bcrypt");
const { randomUUID } = require("node:crypto");

const ADMIN_EMAIL = "admin@example.com";
const BCRYPT_SALT_ROUNDS = 12;

module.exports = {
  async up(queryInterface) {
    const [existingUsers] = await queryInterface.sequelize.query(
      "SELECT 1 FROM users WHERE email = :email LIMIT 1",
      { replacements: { email: ADMIN_EMAIL } }
    );

    if (existingUsers.length > 0) {
      console.log("Admin user already exists");
      return;
    }

    if (!process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_PASSWORD must be set before running the admin seeder");
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

    await queryInterface.bulkInsert("users", [{
      id: randomUUID(),
      name: "System Admin",
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: "ADMIN",
      created_at: now,
      updated_at: now,
    }]);

    console.log("Admin user created successfully");
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: ADMIN_EMAIL, role: "ADMIN" });
  },
};
