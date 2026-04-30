// lib/cloudinary.ts
// Server-side Cloudinary configuration and upload utilities

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64: string, folder: string): Promise<{ url: string; publicId: string }> {
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: folder,
      resource_type: "image",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
    throw new Error("Cloudinary upload failed with an unknown error.");
  }
}
