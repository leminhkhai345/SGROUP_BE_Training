class ApiError extends Error {
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
    }
}

class BadRequestError extends ApiError {
    constructor(message = 'Bad request'){
        super(400, message);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized'){
        super(401, message);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(404, message);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
    }
}

class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

class ServiceUnavailableError extends ApiError {
    constructor(message = 'Service unavailable') { super(503, message); }
}

export {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ForbiddenError,
    ConflictError,
    ServiceUnavailableError,
};
export default ApiError;
