import jwt from "jsonwebtoken";
import {config} from "../config/env.config.js";

export const generateToken = (payload) => {
    return jwt.sign(payload, config.jwt.access_token_secret, {expiresIn: config.jwt.access_token_expiresIn});
};

export const verifyToken = (token) => {
    return jwt.verify(token, config.jwt.access_token_secret);
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.jwt.refresh_token_secret, {expiresIn: config.jwt.refresh_token_expiresIn})
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, config.jwt.refresh_token_secret);
};