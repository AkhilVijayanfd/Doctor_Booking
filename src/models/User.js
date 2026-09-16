import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true, len: [1, 120] } },
    email: {
      type: DataTypes.STRING(254), allowNull: false, unique: true,
      validate: { isEmail: true, isLowercase: true },
      set(value) { this.setDataValue("email", value?.trim().toLowerCase()); },
    },
    passwordHash: {
      type: DataTypes.STRING(255), allowNull: false, field: "password_hash",
      validate: {
        isBcryptHash(value) {
          if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)) {
            throw new Error("passwordHash must be a bcrypt hash");
          }
        },
      },
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "USER"), allowNull: false, defaultValue: "USER",
      validate: { isIn: [["ADMIN", "USER"]] },
    },
  },
  { tableName: "users", underscored: true, timestamps: true }
);

export default User;
