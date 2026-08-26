const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        success: true,
        message,
    };

    if(data !== null && data !== undefined){
        response.data = data;
    }
    return res.status(statusCode).json(response);
}

const sendError = (res, statusCode = 500, message = 'Internal server error', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if(errors !== null && errors !== undefined){
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};

export {sendError, sendSuccess}