import dotenv from "dotenv";
dotenv.config();

export const config = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "postgres",
  },
  jwt: {
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    access_token_expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d",
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  },
};