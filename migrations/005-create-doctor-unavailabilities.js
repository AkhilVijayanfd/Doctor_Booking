"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("doctor_unavailabilities", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      doctor_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "doctors", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      type: { type: Sequelize.STRING(10), allowNull: false },
      start_at: { type: Sequelize.DATE, allowNull: false },
      end_at: { type: Sequelize.DATE, allowNull: false },
      reason: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addConstraint("doctor_unavailabilities", {
      fields: ["type"], type: "check", name: "doctor_unavailabilities_type_allowed",
      where: { type: ["BREAK", "LEAVE", "OTHER"] },
    });
    await queryInterface.addConstraint("doctor_unavailabilities", {
      fields: ["start_at", "end_at"], type: "check", name: "doctor_unavailabilities_valid_time_range",
      where: Sequelize.literal("start_at < end_at"),
    });
    await queryInterface.addIndex("doctor_unavailabilities", ["doctor_id"], { name: "doctor_unavailabilities_doctor_idx" });
    await queryInterface.addIndex("doctor_unavailabilities", ["doctor_id", "start_at", "end_at"], { name: "doctor_unavailabilities_doctor_time_idx" });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("doctor_unavailabilities");
  },
};
