import { validationResult, body } from 'express-validator';
import { BadRequestError } from '../core/error.response.js';

export const validate = (rules) => {
    return async (req, res, next) => {
        // Chạy tuần tự từng rule
        for (const rule of rules) {
            await rule.run(req);
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Gộp tất cả lỗi thành mảng { field, message }
        const formattedErrors = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));

        // Ném BadRequestError kèm danh sách lỗi chi tiết
        const error = new BadRequestError('Validation failed');
        error.errors = formattedErrors;
        return next(error);
    };
};

export const createUserRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is not valid')
        .normalizeEmail(),

    body('age')
        .optional()
        .isInt({ min: 1, max: 120 }).withMessage('Age must be an integer between 1 and 120'),
];