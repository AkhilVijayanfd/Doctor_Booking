const app = require("./app");
const sequelize = require("./config/database");
const env = require("./config/env");

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("Database connected successfully");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
