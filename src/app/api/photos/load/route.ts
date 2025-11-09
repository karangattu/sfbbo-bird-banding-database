import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/services/googleDriveService';

export async function POST(request: NextRequest) {
  try {
    const { folderId, accessToken } = await request.json();

    if (!folderId) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required. Please authenticate with Google Drive first.' },
        { status: 401 }
      );
    }

    const driveService = new GoogleDriveService(accessToken);
    const { files } = await driveService.listFiles(folderId);

    const photos = files.map((file) => ({
      id: file.id,
      googleDriveId: file.id,
      name: file.name,
      thumbnailUrl: file.thumbnailLink || '',
      webViewLink: file.webViewLink,
      tags: [],
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error loading photos from Google Drive:', error);
    return NextResponse.json(
      { error: 'Failed to load photos from Google Drive' },
      { status: 500 }
    );
  }
}
