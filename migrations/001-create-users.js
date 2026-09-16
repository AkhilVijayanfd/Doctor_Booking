"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "USER" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addConstraint("users", {
      fields: ["name"], type: "check", name: "users_name_not_blank",
      where: Sequelize.literal("char_length(btrim(name)) > 0"),
    });
    await queryInterface.addConstraint("users", {
      fields: ["email"], type: "check", name: "users_email_normalized",
      where: Sequelize.literal("email = lower(btrim(email))"),
    });
    await queryInterface.addConstraint("users", {
      fields: ["password_hash"], type: "check", name: "users_password_hash_is_bcrypt",
      where: Sequelize.literal("password_hash ~ '^\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}$'"),
    });
    await queryInterface.addConstraint("users", {
      fields: ["role"], type: "check", name: "users_role_allowed",
      where: { role: ["ADMIN", "USER"] },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
