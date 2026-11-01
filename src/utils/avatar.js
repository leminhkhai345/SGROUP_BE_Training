import sharp from "sharp";
import { BadRequestError } from "../core/error.response.js";

const prepareAvatar = async (file) => {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length > 10 * 1024 * 1024) {
    throw new BadRequestError("A valid avatar of at most 10MB is required");
  }
  try {
    const image = sharp(file.buffer, { limitInputPixels: 16_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
      throw new Error("Unsupported avatar format");
    }
    // Decode and re-encode the pixels; MIME headers and filename extensions are untrusted.
    const buffer = await image.rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).webp().toBuffer();
    return { buffer, originalname: "avatar.webp", mimetype: "image/webp" };
  } catch {
    throw new BadRequestError("Avatar must be a valid, non-animated JPEG, PNG or WebP image (at most 16 megapixels)");
  }
};

export { prepareAvatar };
