import { NextRequest, NextResponse } from 'next/server';
import { ServiceAccountDriveService, PhotoMetadata } from '@/services/serviceAccountDriveService';

export async function POST(req: NextRequest) {
  try {
    const { fileId, metadata } = await req.json() as { fileId: string; metadata: PhotoMetadata };

    // Get service account key from environment
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return NextResponse.json(
        { error: 'Service account key not configured' },
        { status: 500 }
      );
    }

    const keyfileContent = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString());

    // Initialize service
    const driveService = new ServiceAccountDriveService(keyfileContent);

    // Update metadata
    await driveService.updatePhotoMetadata(fileId, metadata);

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully',
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update metadata' },
      { status: 500 }
    );
  }
}
