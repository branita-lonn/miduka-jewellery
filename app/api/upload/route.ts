// app/api/upload/route.ts
// API route for handling image uploads to Cloudinary

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadImage } from "@/lib/cloudinary";

const ALLOWED_FOLDERS = ["miduka/products", "miduka/categories", "miduka/settings", "miduka/reviews", "miduka/branding"];

interface UploadRequest {
  base64: string;
  folder: string;
}

interface UploadResponse {
  url: string;
  publicId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as UploadRequest;
    const { base64, folder } = body;

    // RBAC for folders: only store owners can upload to product/category/settings folders.
    // Authenticated customers can only upload to the reviews folder.
    const isStoreOwner = session.user.role === "STORE_OWNER";
    const isReviewFolder = folder === "miduka/reviews";

    if (!isStoreOwner && !isReviewFolder) {
      return NextResponse.json({ error: "Unauthorized for this folder" }, { status: 403 });
    }

    if (!base64 || typeof base64 !== "string") {
      return NextResponse.json({ error: "Invalid base64 string" }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const { url, publicId } = await uploadImage(base64, folder);

    const response: UploadResponse = { url, publicId };
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`[UPLOAD_ERROR] ${error.message}`);
    } else {
      console.error(`[UPLOAD_ERROR] Unknown error occurred`);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
