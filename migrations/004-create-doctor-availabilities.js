"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("doctor_availabilities", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      doctor_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: "doctors", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      day_of_week: { type: Sequelize.SMALLINT, allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      slot_duration_minutes: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addConstraint("doctor_availabilities", {
      fields: ["day_of_week"], type: "check", name: "doctor_availabilities_valid_day",
      where: Sequelize.literal("day_of_week BETWEEN 0 AND 6"),
    });
    await queryInterface.addConstraint("doctor_availabilities", {
      fields: ["start_time", "end_time"], type: "check", name: "doctor_availabilities_valid_time_range",
      where: Sequelize.literal("start_time < end_time"),
    });
    await queryInterface.addConstraint("doctor_availabilities", {
      fields: ["slot_duration_minutes"], type: "check", name: "doctor_availabilities_positive_duration",
      where: Sequelize.literal("slot_duration_minutes > 0"),
    });
    await queryInterface.addIndex("doctor_availabilities", ["doctor_id", "day_of_week"], { name: "doctor_availabilities_doctor_day_idx" });
    await queryInterface.addIndex("doctor_availabilities", ["doctor_id", "day_of_week", "start_time", "end_time"], {
      name: "doctor_availabilities_unique_window", unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("doctor_availabilities");
  },
};
