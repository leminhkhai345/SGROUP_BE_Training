import ApiError, { BadRequestError, ConflictError, NotFoundError } from "../core/error.response.js";
import { isUuid } from "./idHelper.js";

// Keep business exceptions intact; translate predictable PostgreSQL failures.
const serviceAction = (action) => async (...args) => {
  try {
    return await action(...args);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.code === "23505") throw new ConflictError("Record already exists");
    if (error.code === "23503") throw new BadRequestError("Related record does not exist or is still in use");
    if (["23502", "23514", "22P02", "22007", "22008", "22003", "22001"].includes(error.code)) {
      throw new BadRequestError("Invalid data");
    }
    throw error;
  }
};

const requireRecord = (record, label = "Record") => {
  if (!record) throw new NotFoundError(`${label} not found`);
  return record;
};

const validateId = (value, field = "id") => {
  if (!isUuid(value)) {
    throw new BadRequestError(`${field} must be a valid UUID`);
  }
  return value;
};

const validatePositiveInteger = (value, field) => {
  if (!["string", "number"].includes(typeof value) || !/^[1-9]\d*$/.test(String(value))) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }
  return value;
};

const validateBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new BadRequestError("Request body must be an object");
  return body;
};

const textField = (value, field, required = false) => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) throw new BadRequestError(`${field} must be a non-empty string`);
  return value.trim();
};

const dateField = (value, field) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new BadRequestError(`${field} must be a valid date`);
  }
  return value;
};

const numberField = (value, field, minimum = 0) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new BadRequestError(`${field} must be a number >= ${minimum}`);
  }
  return value;
};

const pick = (body, fields) => Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

const sorting = (options = {}, columns) => {
  const { sortBy = "id", order = "ASC" } = options;
  if (!columns.includes(sortBy)) throw new BadRequestError("Invalid sortBy column");
  if (typeof order !== "string" || !["ASC", "DESC"].includes(order.toUpperCase())) throw new BadRequestError("Invalid sort order");
  return { sortBy, order: order.toUpperCase() };
};

const pagination = (options = {}) => {
  const integer = (value, field, fallback, maximum) => {
    if (value === undefined) return fallback;
    if (!["string", "number"].includes(typeof value) || !/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > maximum) {
      throw new BadRequestError(`${field} must be an integer between 1 and ${maximum}`);
    }
    return Number(value);
  };
  const page = integer(options.page, "page", 1, 1_000_000);
  const limit = integer(options.limit, "limit", 20, 100);
  return { page, limit, offset: (page - 1) * limit };
};

export {
  serviceAction,
  requireRecord,
  validateId,
  validatePositiveInteger,
  validateBody,
  textField,
  dateField,
  numberField,
  pick,
  sorting,
  pagination,
};
