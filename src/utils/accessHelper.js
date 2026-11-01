const isAdmin = (actor) => actor?.roles?.includes("ADMIN") === true;
const sameId = (left, right) => left != null && right != null && String(left) === String(right);
const hasPermission = (actor, permission) => isAdmin(actor) || actor?.permissions?.includes(permission) === true || actor?.permissions?.includes("*") === true;

export { isAdmin, sameId, hasPermission };
