"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("doctors", "email", {
      type: Sequelize.STRING(254),
      allowNull: false,
    });
    await queryInterface.removeIndex("doctors", "doctors_email_idx");
    await queryInterface.addConstraint("doctors", {
      fields: ["email"],
      type: "unique",
      name: "doctors_email_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("doctors", "doctors_email_unique");
    await queryInterface.addIndex("doctors", ["email"], { name: "doctors_email_idx" });
    await queryInterface.changeColumn("doctors", "email", {
      type: Sequelize.STRING(254),
      allowNull: true,
    });
  },
};
