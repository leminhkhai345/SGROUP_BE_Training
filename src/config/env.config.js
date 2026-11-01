import dotenv from "dotenv";
dotenv.config();

const config = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV,
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    access_token_expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  },
};

export { config };