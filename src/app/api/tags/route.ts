import { NextRequest, NextResponse } from 'next/server';
import { tursoService } from '@/services/tursoService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'photoId is required' },
        { status: 400 }
      );
    }

    const tags = await tursoService.getPhotoTags(photoId);
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('POST /api/tags - Received body:', body);

    const { photoId, tag } = body;

    if (!photoId || !tag) {
      console.error('Missing photoId or tag:', { photoId, tag });
      return NextResponse.json(
        { error: 'photoId and tag are required' },
        { status: 400 }
      );
    }

    console.log('Attempting to add tag to Turso:', { photoId, tag });
    const tagId = await tursoService.addTag(photoId, tag);
    console.log('Tag added successfully with ID:', tagId);

    return NextResponse.json({ success: true, tagId });
  } catch (error) {
    console.error('Error adding tag:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add tag' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { tagId, tag } = await req.json();

    if (!tagId || !tag) {
      return NextResponse.json(
        { error: 'tagId and tag are required' },
        { status: 400 }
      );
    }

    await tursoService.updateTag(tagId, tag);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tag' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      );
    }

    await tursoService.deleteTag(tagId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
