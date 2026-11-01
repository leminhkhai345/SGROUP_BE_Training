import { rateLimit } from "express-rate-limit";

const createAuthLimiter = (options = {}) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests; try again later" },
  ...options,
});

export { createAuthLimiter };
