import env from "../src/config/env.js";

const databaseConfig = {
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  host: env.database.host,
  port: env.database.port,
  dialect: "postgres",
  logging: false,
};

export default {
  [env.nodeEnv]: databaseConfig,
};
