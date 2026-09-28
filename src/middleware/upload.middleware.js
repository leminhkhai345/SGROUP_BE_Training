import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

const multiUpload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5,
    },

})

const requireFile = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            message: "At least one file is required",
        });
    }

    next();
};

const uploadFiveFiles = (req, res, next) => {
    multiUpload.array("files", 5)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            if (
                error.code === "LIMIT_FILE_COUNT" ||
                error.code === "LIMIT_UNEXPECTED_FILE"
            ) {
                return res.status(400).json({
                    message: "Maximum 5 files allowed",
                });
            }

            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    message: "Each file must not exceed 10MB",
                });
            }
        }

        return next(error);
    });
};

export { upload, requireFile, multiUpload, uploadFiveFiles};
