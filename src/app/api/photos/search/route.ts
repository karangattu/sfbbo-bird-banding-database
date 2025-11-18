import { NextRequest, NextResponse } from "next/server";
import { tursoService } from "@/services/tursoService";
import { ServiceAccountDriveService } from "@/services/serviceAccountDriveService";

export async function POST(req: NextRequest) {
  try {
    const criteria = await req.json();
    console.log("Searching photos with criteria:", criteria);

    // 1. Search tags in Turso
    const tags = await tursoService.searchTags(criteria);
    console.log(`Found ${tags.length} matching tags`);

    if (tags.length === 0) {
      return NextResponse.json({ photos: [] });
    }

    // 2. Extract unique photo IDs
    const photoIds = Array.from(new Set(tags.map((tag) => tag.photoId)));
    console.log(`Found ${photoIds.length} unique photos`);

    // 3. Initialize Drive Service
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
    const driveService = new ServiceAccountDriveService(keyfileContent);

    // 4. Fetch photo metadata from Google Drive
    // We'll fetch in parallel
    const photos = await Promise.all(
      photoIds.map(async (photoId) => {
        try {
          const fileMetadata = await driveService.getFileMetadata(photoId);

          // Filter tags for this specific photo
          const photoTags = tags.filter((t) => t.photoId === photoId);

          return {
            id: fileMetadata.id,
            googleDriveId: fileMetadata.id,
            name: fileMetadata.name,
            mimeType: "image/jpeg", // Assuming images, or we could get it from metadata if available
            imageUrl: `/api/photos/thumbnail/${fileMetadata.id}`,
            webViewLink: fileMetadata.webViewLink,
            createdTime: fileMetadata.createdTime,
            modifiedTime: fileMetadata.modifiedTime,
            tags: photoTags,
            createdAt: fileMetadata.createdTime || new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching metadata for photo ${photoId}:`, error);
          return null;
        }
      })
    );

    // Filter out any nulls (failed fetches)
    const validPhotos = photos.filter((p) => p !== null);

    return NextResponse.json({ photos: validPhotos });
  } catch (error) {
    console.error("Error searching photos:", error);
    return NextResponse.json(
      { error: "Failed to search photos" },
      { status: 500 }
    );
  }
}
