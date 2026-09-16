"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("appointments", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      doctor_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "doctors", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      start_at: { type: Sequelize.DATE, allowNull: false },
      end_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "BOOKED" },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addConstraint("appointments", {
      fields: ["status"], type: "check", name: "appointments_status_allowed",
      where: { status: ["BOOKED", "CANCELLED", "COMPLETED"] },
    });
    await queryInterface.addConstraint("appointments", {
      fields: ["start_at", "end_at"], type: "check", name: "appointments_valid_time_range",
      where: Sequelize.literal("start_at < end_at"),
    });
    await queryInterface.addIndex("appointments", ["doctor_id"], { name: "appointments_doctor_idx" });
    await queryInterface.addIndex("appointments", ["user_id"], { name: "appointments_user_idx" });
    await queryInterface.addIndex("appointments", ["doctor_id", "start_at"], {
      name: "appointments_unique_doctor_slot", unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("appointments");
  },
};
