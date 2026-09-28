import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

import r2Client from "../config/r2.config.js";
import { BadRequestError } from "../core/error.response.js";

export const uploadFile = async (file, onUploaded) => {
  if (!file) {
    throw new Exception();
  }
  const extension = file.originalname.split(".").pop();

  const fileName = `${randomUUID()}.${extension}`;

  const key = `uploads/${fileName}`;

  // Upload file
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  onUploaded?.(key);

  const url = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
    {
      expiresIn: 3600,
    },
  );

  return {
    key,
    fileName,
    url,
  };
};

export const getFileUrl = async (key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, {
    expiresIn: 3600,
  });
};

export const uploadMultiFiles = async (files) => {
  if (!files?.length || files.length > 5) {
    throw new BadRequestError("Please upload 1 to 5 files");
  }
  const uploadedKeys = [];
  const results = await Promise.allSettled(
    files.map((file) => uploadFile(file, (key) => uploadedKeys.push(key))),
  );
  const successful = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failed = results.filter((result) => result.status === "rejected");

  // Nếu có file upload lỗi, xóa những file đã upload thành công
  if (failed.length > 0) {
    const cleanup = await Promise.allSettled(
      uploadedKeys.map((key) =>
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
          }),
        ),
      ),
    );

    cleanup.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          "R2 cleanup failed:",
          uploadedKeys[index],
          result.reason,
        );
      }
    });

    throw new Error("One or more files failed to upload");
  }
  return successful;
};
