import jwt from "jsonwebtoken";
import * as jwtHelper from "../utils/jwtHelper.js";
import { UnauthorizedError } from "../core/error.response.js";

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("invalid token");
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwtHelper.verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};