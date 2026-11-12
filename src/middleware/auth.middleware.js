import { verifyToken } from "../utils/jwtHelper.js";
import { UnauthorizedError, ForbiddenError } from "../core/error.response.js";
import { getUserAccess, hasPermission, requireActor } from "../services/authorization.service.js";

const authenticate = async (req, res, next) => {
  try {
    const match = typeof req.headers.authorization === "string" && /^Bearer\s+(\S+)$/i.exec(req.headers.authorization);
    if (!match) throw new UnauthorizedError("Bearer token is required");
    const payload = verifyToken(match[1]);

    req.user = await getUserAccess(payload.id);
    next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    next(error);
  }
};

const authorizePermissions = (...permissions) => (req, res, next) => {
  try {
    requireActor(req.user);
    if (!permissions.every((permission) => hasPermission(req.user, permission))) throw new ForbiddenError("Insufficient permissions");
    next();
  } catch (error) { next(error); }
};

export { authenticate, authorizePermissions };
