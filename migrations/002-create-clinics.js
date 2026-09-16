"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("clinics", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      timezone: { type: Sequelize.STRING(100), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addConstraint("clinics", {
      fields: ["name"], type: "check", name: "clinics_name_not_blank",
      where: Sequelize.literal("char_length(btrim(name)) > 0"),
    });
    await queryInterface.addConstraint("clinics", {
      fields: ["timezone"], type: "check", name: "clinics_timezone_iana_format",
      where: Sequelize.literal("timezone ~ '^[A-Za-z_]+/[A-Za-z_]+(?:/[A-Za-z_]+)*$'"),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("clinics");
  },
};
