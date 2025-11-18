import { NextRequest, NextResponse } from "next/server";
import { ServiceAccountDriveService } from "@/services/serviceAccountDriveService";

export async function POST(req: NextRequest) {
  try {
    const { folderId } = await req.json();

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

    // List photos with metadata
    const photos = await driveService.listPhotosWithMetadata(folderId);

    return NextResponse.json({
      success: true,
      photos: photos.map((photo) => ({
        id: photo.id,
        name: photo.name,
        mimeType: photo.mimeType,
        imageUrl: photo.imageUrl, // Include direct Google Drive thumbnail URL
        webViewLink: photo.webViewLink,
        createdTime: photo.createdTime,
        modifiedTime: photo.modifiedTime,
        metadata: photo.metadata,
      })),
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch photos",
      },
      { status: 500 }
    );
  }
}
