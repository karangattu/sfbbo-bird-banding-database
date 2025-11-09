import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let connectionUrl = process.env.TURSO_CONNECTION_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!connectionUrl || !authToken) {
      return NextResponse.json(
        { error: 'Turso database not configured' },
        { status: 500 }
      );
    }

    if (connectionUrl.startsWith('libsql://')) {
      connectionUrl = connectionUrl.replace('libsql://', 'https://');
    }

    console.log('Initializing database with URL:', connectionUrl);

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS photo_tags (
        id TEXT PRIMARY KEY,
        photoId TEXT NOT NULL,
        recordId TEXT,
        bandNumber TEXT,
        date TEXT,
        location TEXT,
        species TEXT,
        age TEXT,
        sex TEXT,
        firstPhotoNumber TEXT,
        lastPhotoNumber TEXT,
        wrpPlumageCode TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `;

    const response = await fetch(connectionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statements: [
          { q: createTableQuery, params: [] },
          { q: 'CREATE INDEX IF NOT EXISTS idx_photo_tags_photoId ON photo_tags(photoId)', params: [] },
          { q: 'CREATE INDEX IF NOT EXISTS idx_photo_tags_recordId ON photo_tags(recordId)', params: [] },
          { q: 'CREATE INDEX IF NOT EXISTS idx_photo_tags_bandNumber ON photo_tags(bandNumber)', params: [] },
          { q: 'CREATE INDEX IF NOT EXISTS idx_photo_tags_species ON photo_tags(species)', params: [] },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Database initialization failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to initialize database', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Database initialized successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Database table created successfully',
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
