// Canonical UUID text, matching PostgreSQL UUID output (case-insensitive input).
const UUID_PATTERN = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
const uuidPattern = new RegExp(`^${UUID_PATTERN}$`, "i");
const isUuid = (value) => typeof value === "string" && uuidPattern.test(value);

export { UUID_PATTERN, isUuid };
