import axios from 'axios';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async listFiles(folderId: string, pageToken?: string): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    try {
      const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
          spaces: 'drive',
          fields: 'files(id, name, mimeType, thumbnailLink, webViewLink), nextPageToken',
          pageSize: 20,
          pageToken,
        },
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            fields: 'id, name, mimeType, thumbnailLink, webViewLink',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: 'arraybuffer',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}
