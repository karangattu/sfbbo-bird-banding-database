import { PhotoTag } from '@/types';

// Types for Turso responses
interface TursoResponse {
  results?: {
    rows?: Array<Record<string, any>>;
  };
  success: boolean;
  error?: string;
}

export class TursoService {
  private connectionUrl: string;
  private authToken: string;
  private isConfigured: boolean;

  constructor() {
    let connectionUrl = process.env.TURSO_CONNECTION_URL || '';

    if (connectionUrl.startsWith('libsql://')) {
      connectionUrl = connectionUrl.replace('libsql://', 'https://');
    }

    this.connectionUrl = connectionUrl;
    this.authToken = process.env.TURSO_AUTH_TOKEN || '';

    this.isConfigured = !!(this.connectionUrl && this.authToken);

    if (!this.isConfigured) {
      console.warn(
        'Turso database not configured. Add TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN to .env.local. Tags will work in-memory only.'
      );
    } else {
      console.log('Turso configured with URL:', this.connectionUrl.substring(0, 50) + '...');
    }
  }

  private async executeQuery(query: string, params?: any[]): Promise<any[]> {
    if (!this.isConfigured) {
      console.warn('Turso not configured. Returning empty results.');
      return [];
    }

    try {
      console.log('Executing Turso query:', { query, params });

      const response = await fetch(`${this.connectionUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statements: [
            {
              q: query,
              params: params || [],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Turso HTTP error response:', errorData);
        throw new Error(`Turso query failed: ${response.statusText} - ${errorData}`);
      }

      const data: any = await response.json();
      console.log('Turso response:', JSON.stringify(data, null, 2));

      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data) && data[0] && data[0].results) {
        const result = data[0].results;

        if (result.error) {
          throw new Error(result.error.message || 'Query execution failed');
        }

        const columns = result.columns || [];
        const rows = result.rows || [];

        const parsedRows = rows.map((row: any) => {
          const rowObj: any = {};
          columns.forEach((col: string, index: number) => {
            rowObj[col] = row[index];
          });
          return rowObj;
        });

        console.log('Parsed rows:', parsedRows);
        return parsedRows;
      }

      return [];
    } catch (error) {
      console.error('Turso query error:', {
        error,
        query,
        params,
        connectionUrl: this.connectionUrl.substring(0, 50) + '...',
      });
      throw error;
    }
  }

  /**
   * Get all tags for a photo
   */
  async getPhotoTags(photoId: string): Promise<PhotoTag[]> {
    try {
      console.log('=== getPhotoTags START ===');
      console.log('Requested photoId:', photoId);

      const query = `
        SELECT * FROM photo_tags
        WHERE photoId = ?
        ORDER BY createdAt DESC
      `;
      const rows = await this.executeQuery(query, [photoId]);

      console.log(`Found ${rows.length} rows for photoId ${photoId}`);
      console.log('Raw rows:', JSON.stringify(rows, null, 2));

      const tags = rows.map((row: any) => ({
        id: row.id,
        recordId: row.recordId || '',
        bandNumber: row.bandNumber || '',
        date: row.date || '',
        location: row.location || '',
        species: row.species || '',
        age: row.age || '',
        sex: row.sex || '',
        firstPhotoNumber: row.firstPhotoNumber,
        lastPhotoNumber: row.lastPhotoNumber,
        wrpPlumageCode: row.wrpPlumageCode,
        notes: row.notes,
        createdAt: row.createdAt,
      }));

      console.log('Mapped tags:', JSON.stringify(tags, null, 2));
      console.log('=== getPhotoTags END ===');
      return tags;
    } catch (error) {
      console.error('Error fetching photo tags:', error);
      return [];
    }
  }

  /**
   * Add a new tag
   */
  async addTag(
    photoId: string,
    tag: Omit<PhotoTag, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      console.log('=== addTag START ===');
      console.log('Adding tag for photoId:', photoId);
      console.log('Tag data:', tag);

      const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const query = `
        INSERT INTO photo_tags (
          id, photoId, recordId, bandNumber, date, location,
          species, age, sex, firstPhotoNumber, lastPhotoNumber,
          wrpPlumageCode, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        tagId,
        photoId,
        tag.recordId || null,
        tag.bandNumber || null,
        tag.date || null,
        tag.location || null,
        tag.species || null,
        tag.age || null,
        tag.sex || null,
        tag.firstPhotoNumber || null,
        tag.lastPhotoNumber || null,
        tag.wrpPlumageCode || null,
        tag.notes || null,
        now,
      ];

      console.log('Insert params:', params);

      await this.executeQuery(query, params);
      console.log('Tag inserted with ID:', tagId);
      console.log('=== addTag END ===');
      return tagId;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  /**
   * Update an existing tag
   */
  async updateTag(tagId: string, updates: Partial<PhotoTag>): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.recordId !== undefined) {
        updateFields.push('recordId = ?');
        values.push(updates.recordId);
      }
      if (updates.bandNumber !== undefined) {
        updateFields.push('bandNumber = ?');
        values.push(updates.bandNumber);
      }
      if (updates.date !== undefined) {
        updateFields.push('date = ?');
        values.push(updates.date);
      }
      if (updates.location !== undefined) {
        updateFields.push('location = ?');
        values.push(updates.location);
      }
      if (updates.species !== undefined) {
        updateFields.push('species = ?');
        values.push(updates.species);
      }
      if (updates.age !== undefined) {
        updateFields.push('age = ?');
        values.push(updates.age);
      }
      if (updates.sex !== undefined) {
        updateFields.push('sex = ?');
        values.push(updates.sex);
      }
      if (updates.firstPhotoNumber !== undefined) {
        updateFields.push('firstPhotoNumber = ?');
        values.push(updates.firstPhotoNumber);
      }
      if (updates.lastPhotoNumber !== undefined) {
        updateFields.push('lastPhotoNumber = ?');
        values.push(updates.lastPhotoNumber);
      }
      if (updates.wrpPlumageCode !== undefined) {
        updateFields.push('wrpPlumageCode = ?');
        values.push(updates.wrpPlumageCode);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updates.notes);
      }

      if (updateFields.length === 0) return; // No updates

      updateFields.push('updatedAt = ?');
      values.push(now);
      values.push(tagId);

      const query = `
        UPDATE photo_tags 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      await this.executeQuery(query, values);
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      const query = 'DELETE FROM photo_tags WHERE id = ?';
      await this.executeQuery(query, [tagId]);
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * Search tags by criteria
   */
  async searchTags(criteria: {
    species?: string;
    bandNumber?: string;
    location?: string;
    recordId?: string;
  }): Promise<PhotoTag[]> {
    try {
      let query = 'SELECT * FROM photo_tags WHERE 1=1';
      const params: any[] = [];

      if (criteria.species) {
        query += ' AND species LIKE ?';
        params.push(`%${criteria.species}%`);
      }
      if (criteria.bandNumber) {
        query += ' AND bandNumber LIKE ?';
        params.push(`%${criteria.bandNumber}%`);
      }
      if (criteria.location) {
        query += ' AND location LIKE ?';
        params.push(`%${criteria.location}%`);
      }
      if (criteria.recordId) {
        query += ' AND recordId LIKE ?';
        params.push(`%${criteria.recordId}%`);
      }

      query += ' ORDER BY createdAt DESC';

      const rows = await this.executeQuery(query, params);

      return rows.map((row: any) => ({
        id: row.id,
        recordId: row.recordId || '',
        bandNumber: row.bandNumber || '',
        date: row.date || '',
        location: row.location || '',
        species: row.species || '',
        age: row.age || '',
        sex: row.sex || '',
        firstPhotoNumber: row.firstPhotoNumber,
        lastPhotoNumber: row.lastPhotoNumber,
        wrpPlumageCode: row.wrpPlumageCode,
        notes: row.notes,
        createdAt: row.createdAt,
      }));
    } catch (error) {
      console.error('Error searching tags:', error);
      return [];
    }
  }

  /**
   * Delete all tags for a photo
   */
  async deletePhotoTags(photoId: string): Promise<void> {
    try {
      console.log('Deleting all tags for photoId:', photoId);
      const query = `DELETE FROM photo_tags WHERE photoId = ?`;
      await this.executeQuery(query, [photoId]);
      console.log('Successfully deleted all tags for photoId:', photoId);
    } catch (error) {
      console.error('Error deleting photo tags:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tursoService = new TursoService();
