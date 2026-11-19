import bcrypt from "bcrypt";

const hasLetterAndDigit = (password) => /\p{L}/u.test(password) && /\p{Nd}/u.test(password);

const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};

const comparePassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

export { hashPassword, comparePassword, hasLetterAndDigit };
