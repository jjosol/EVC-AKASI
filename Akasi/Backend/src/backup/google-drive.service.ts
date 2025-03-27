import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive;

  constructor() {
    // Initialize Google Drive API
    this.initDriveClient();
  }

  private initDriveClient() {
    try {
      // Path to service account credentials file
      const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
      
      // Check if the credentials file exists
      if (!fs.existsSync(keyFilePath)) {
        this.logger.error('Google credentials file not found');
        return;
      }

      // Create JWT client using service account
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      // Create Drive client
      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive client', error);
    }
  }

  async uploadFile(filePath: string, filename: string, folderId?: string): Promise<any> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive client not initialized');
      }

      // Prepare file metadata
      const fileMetadata = {
        name: filename,
        parents: folderId ? [folderId] : undefined,
      };

      // Create media object
      const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(filePath),
      };

      // Upload file to Drive
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink',
      });

      // Make the file publicly accessible (optional)
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        success: true,
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Google Drive', error);
      throw new Error(`Failed to upload to Google Drive: ${error.message}`);
    }
  }

  async listFolders(): Promise<any[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive client not initialized');
      }

      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      return response.data.files || [];
    } catch (error) {
      this.logger.error('Error listing Google Drive folders', error);
      throw new Error(`Failed to list Drive folders: ${error.message}`);
    }
  }

  async createFolder(folderName: string): Promise<any> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive client not initialized');
      }

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink',
      });

      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error('Error creating Google Drive folder', error);
      throw new Error(`Failed to create Drive folder: ${error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      // Check if client is initialized
      if (!this.drive) {
        throw new Error('Google Drive client not initialized');
      }

      // Delete the file by ID
      await this.drive.files.delete({
        fileId: fileId,
      });
      
      this.logger.log(`Successfully deleted file from Google Drive: ${fileId}`);
      return;
    } catch (error) {
      this.logger.error(`Failed to delete file from Google Drive: ${error.message}`);
      throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
    }
  }
}