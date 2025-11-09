import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { Readable } from 'stream';

export interface ServiceAccountConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface PhotoMetadata {
  recordId: string;
  bandNumber: string;
  date: string;
  location: string;
  species: string;
  age: string;
  sex: string;
  firstPhotoNumber?: string;
  lastPhotoNumber?: string;
  wrpPlumageCode?: string;
  notes?: string;
}

export class ServiceAccountDriveService {
  private auth: JWT;
  private drive: any;

  constructor(keyfileContent: ServiceAccountConfig) {
    this.auth = new JWT({
      email: keyfileContent.client_email,
      key: keyfileContent.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({
      version: 'v3',
      auth: this.auth as any,
    });
  }

  /**
   * Upload a photo file to Google Drive
   * @param fileBuffer - File content as Buffer
   * @param fileName - Name of the file
   * @param folderId - Google Drive folder ID to upload to
   * @param metadata - Photo metadata to store as description
   * @returns File ID and web link
   */
  async uploadPhoto(
    fileBuffer: Buffer,
    fileName: string,
    folderId: string,
    metadata: PhotoMetadata
  ): Promise<{ id: string; webViewLink: string; metadata: PhotoMetadata }> {
    try {
      // Create a readable stream from the buffer
      const stream = Readable.from(fileBuffer);

      // Prepare file metadata with searchable description
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
        description: JSON.stringify(metadata), // Store metadata in description for searching
        properties: {
          recordId: metadata.recordId,
          bandNumber: metadata.bandNumber,
          species: metadata.species,
          location: metadata.location,
          date: metadata.date,
          age: metadata.age,
          sex: metadata.sex,
        },
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: stream,
        },
        fields: 'id, webViewLink, name',
      });

      return {
        id: response.data.id,
        webViewLink: response.data.webViewLink,
        metadata,
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Update metadata for an existing photo
   * @param fileId - Google Drive file ID
   * @param metadata - Updated metadata
   */
  async updatePhotoMetadata(fileId: string, metadata: PhotoMetadata): Promise<void> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: {
          description: JSON.stringify(metadata),
          properties: {
            recordId: metadata.recordId,
            bandNumber: metadata.bandNumber,
            species: metadata.species,
            location: metadata.location,
            date: metadata.date,
            age: metadata.age,
            sex: metadata.sex,
          },
        },
        fields: 'id',
      });
    } catch (error) {
      console.error('Error updating photo metadata:', error);
      throw error;
    }
  }

  /**
   * Search for photos by metadata
   * @param folderId - Google Drive folder ID to search within
   * @param searchQuery - Search query (e.g., "species contains 'Warbler'")
   */
  async searchPhotos(folderId: string, searchQuery?: string): Promise<any[]> {
    try {
      let q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;

      if (searchQuery) {
        q += ` and (${searchQuery})`;
      }

      const response = await this.drive.files.list({
        q,
        spaces: 'drive',
        fields: 'files(id, name, description, properties, webViewLink, createdTime, modifiedTime)',
        pageSize: 50,
      });

      // Parse metadata from descriptions
      return (response.data.files || []).map((file: any) => ({
        ...file,
        metadata: file.description ? JSON.parse(file.description) : {},
      }));
    } catch (error) {
      console.error('Error searching photos:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param fileId - Google Drive file ID
   */
  async getFileMetadata(fileId: string): Promise<any> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, description, properties, webViewLink, createdTime, modifiedTime',
      });

      return {
        ...response.data,
        metadata: response.data.description ? JSON.parse(response.data.description) : {},
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * List all photos in a folder with their metadata
   * @param folderId - Google Drive folder ID
   */
  async listPhotosWithMetadata(folderId: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        spaces: 'drive',
        fields: 'files(id, name, description, properties, webViewLink, thumbnailLink, createdTime, modifiedTime)',
        pageSize: 100,
      });

      return (response.data.files || []).map((file: any) => ({
        ...file,
        imageUrl: `/api/photos/thumbnail/${file.id}`,
        metadata: file.description ? JSON.parse(file.description) : {},
      }));
    } catch (error) {
      console.error('Error listing photos:', error);
      throw error;
    }
  }

  /**
   * Delete a photo
   * @param fileId - Google Drive file ID
   */
  async deletePhoto(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }
}
