import { uploadFile, uploadMultiFiles } from "../services/upload.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

const uploadFileController = catchAsync(async (req, res) => {

        const result = await uploadFile(req.file);

        return sendSuccess(res, 201, "Upload file successfully", result);

});


const uploadMultiFilesController = catchAsync(async (req, res) => {
    const files = await uploadMultiFiles(req.files);
    return sendSuccess(res, 201, "Upload files successfully", {
        count: files.length,
        files,
    });
});

export {uploadFileController, uploadMultiFilesController};
