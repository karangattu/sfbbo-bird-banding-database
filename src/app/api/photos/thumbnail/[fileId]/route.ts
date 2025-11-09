import { NextRequest, NextResponse } from 'next/server';
import { ServiceAccountDriveService } from '@/services/serviceAccountDriveService';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return NextResponse.json(
        { error: 'Service account key not configured' },
        { status: 500 }
      );
    }

    const keyfileContent = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString());
    const driveService = new ServiceAccountDriveService(keyfileContent);

    const imageBuffer = await driveService['drive'].files.get(
      {
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    return new NextResponse(imageBuffer.data as ArrayBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thumbnail' },
      { status: 500 }
    );
  }
}
