const sameId = (left, right) => left != null && right != null && String(left).toLowerCase() === String(right).toLowerCase();
const hasPermission = (actor, permission) => actor?.permissions?.includes(permission) === true || actor?.permissions?.includes("*") === true;

const isAdmin = (actor) => actor?.roles?.includes("ADMIN") === true;

export { isAdmin, sameId, hasPermission };
