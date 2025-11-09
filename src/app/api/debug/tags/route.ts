import { NextResponse } from 'next/server';
import { tursoService } from '@/services/tursoService';

export async function GET() {
  try {
    const query = 'SELECT id, photoId, recordId, species FROM photo_tags ORDER BY createdAt DESC LIMIT 10';
    const rows = await (tursoService as any).executeQuery(query, []);

    return NextResponse.json({
      success: true,
      count: rows.length,
      tags: rows,
    });
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
