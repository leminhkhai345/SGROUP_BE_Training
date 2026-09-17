import ApiError from "../core/error.response.js";

const errorHandler = (err, req, res, next) => {
    console.log(`[ERROR] ${err.name}: ${err.message}`);

    if(err instanceof ApiError){
        const response = {
            success: false,
            message: err.message,
        };
        if(err.errors) response.errors = err.errors;
        console.log(err.statusCode);
        return res.status(err.statusCode).json(response);
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
}

export default errorHandler;