import { validationResult, body } from 'express-validator';
import { BadRequestError } from '../core/error.response.js';

const validate = (rules) => {
    return async (req, res, next) => {
        for (const rule of rules) {
            await rule.run(req);
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const formattedErrors = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));

        const error = new BadRequestError('Validation failed');
        error.errors = formattedErrors;
        return next(error);
    };
};

const registerRules = [
    body('name')
        .isString().withMessage('Name must be a string')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .isString().withMessage('Email must be a string')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is not valid')
        .toLowerCase(),

    body('password')
        .isString().withMessage('Password must be a string')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must contain at least 6 characters')
        .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password must not exceed 72 UTF-8 bytes'),
];

const updateUserRules = [
    body('name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isString().trim().isEmail().toLowerCase(),
    body('phone').optional().isString().trim().notEmpty(),
    body('dob').optional().isISO8601(),
];

const loginRules = [
  body("email")
    .isString().withMessage("Email must be a string")
    .trim()
    .notEmpty().withMessage("Email must be not empty")
    .isEmail().withMessage("Email is invalid")
    .toLowerCase(),

  body("password")
    .isString().withMessage("Password must be a string")
    .notEmpty().withMessage("password is required"),
];

export { validate, registerRules, updateUserRules, loginRules };