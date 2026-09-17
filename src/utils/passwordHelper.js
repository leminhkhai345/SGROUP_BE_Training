import bcrypt from "bcrypt";

export const hashPassword = async(password) => {
    return bcrypt.hash(password, 10);
};

export const comparePassword = async(password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
}
