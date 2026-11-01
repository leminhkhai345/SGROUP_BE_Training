import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

const verify = (token, secret, type) => {
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  if (!payload || typeof payload !== "object" || payload.tokenType !== type || !/^[1-9]\d*$/.test(String(payload.id))) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return payload;
};

const generateToken = (payload) => jwt.sign({ id: payload.id, tokenType: "access" }, config.jwt.access_token_secret, { algorithm: "HS256", expiresIn: config.jwt.access_token_expiresIn });
const verifyToken = (token) => verify(token, config.jwt.access_token_secret, "access");
const generateRefreshToken = (payload) => jwt.sign({ id: payload.id, tokenType: "refresh" }, config.jwt.refresh_token_secret, { algorithm: "HS256", expiresIn: config.jwt.refresh_token_expiresIn });
const verifyRefreshToken = (token) => verify(token, config.jwt.refresh_token_secret, "refresh");

export {
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
};
