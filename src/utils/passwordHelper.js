import bcrypt from "bcrypt";

const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

const comparePassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

export { hashPassword, comparePassword };
