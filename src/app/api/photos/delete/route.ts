import { NextRequest, NextResponse } from 'next/server';
import { ServiceAccountDriveService } from '@/services/serviceAccountDriveService';
import { tursoService } from '@/services/tursoService';

const getServiceAccount = () => {
  const keyfileBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyfileBase64) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  }

  const keyfileJson = Buffer.from(keyfileBase64, 'base64').toString('utf-8');
  return JSON.parse(keyfileJson);
};

export async function POST(request: NextRequest) {
  try {
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      );
    }

    // Delete photo from Google Drive
    const serviceAccount = getServiceAccount();
    const driveService = new ServiceAccountDriveService(serviceAccount);
    await driveService.deletePhoto(photoId);

    // Delete all associated tags from Turso
    await tursoService.deletePhotoTags(photoId);

    return NextResponse.json({
      success: true,
      message: 'Photo and associated tags deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
