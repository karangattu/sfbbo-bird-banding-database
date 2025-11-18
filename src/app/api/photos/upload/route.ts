import { NextRequest, NextResponse } from "next/server";
import {
  ServiceAccountDriveService,
  PhotoMetadata,
} from "@/services/serviceAccountDriveService";
import { tursoService } from "@/services/tursoService";
import busboy from "busboy";

// Parse multipart form data
async function parseFormData(req: NextRequest) {
  const contentType = req.headers.get("content-type");

  if (!contentType?.includes("multipart/form-data")) {
    throw new Error("Invalid content type");
  }

  const formData = await req.formData();
  return formData;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await parseFormData(req);

    // Get service account key from environment
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return NextResponse.json(
        { error: "Service account key not configured" },
        { status: 500 }
      );
    }

    const keyfileContent = JSON.parse(
      Buffer.from(serviceAccountKey, "base64").toString()
    );

    // Initialize service
    const driveService = new ServiceAccountDriveService(keyfileContent);

    // Get file and metadata from form data
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const metadata = JSON.parse(
      formData.get("metadata") as string
    ) as PhotoMetadata;

    if (!file || !folderId) {
      return NextResponse.json(
        { error: "Missing file or folderId" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Google Drive
    const result = await driveService.uploadPhoto(
      fileBuffer,
      file.name,
      folderId,
      metadata
    );

    // Save tag to Turso database
    try {
      const tagId = await tursoService.addTag(result.id, {
        recordId: metadata.recordId,
        bandNumber: metadata.bandNumber,
        date: metadata.date,
        location: metadata.location,
        species: metadata.species,
        age: metadata.age,
        sex: metadata.sex,
        firstPhotoNumber: metadata.firstPhotoNumber,
        lastPhotoNumber: metadata.lastPhotoNumber,
        wrpPlumageCode: metadata.wrpPlumageCode,
        notes: metadata.notes,
      });
      console.log("Tag saved to Turso with ID:", tagId);
    } catch (tagError) {
      console.error("Failed to save tag to Turso:", tagError);
    }

    return NextResponse.json({
      success: true,
      fileId: result.id,
      webViewLink: result.webViewLink,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
