import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive;

  constructor() {
    this.initializeDrive();
  }

  private initializeDrive() {
    try {
      const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        this.logger.warn('Google Drive credentials file not found at:', credentialsPath);
        return;
      }
      
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      
      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive API initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Google Drive API:', error);
    }
  }

  async uploadFileToDrive(filePath: string, folderId?: string): Promise<{ driveFileId: string, driveLink: string }> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized');
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File ${filePath} does not exist`);
      }
      
      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;
      const fileStream = fs.createReadStream(filePath);
      
      this.logger.log(`Uploading ${fileName} (${fileSize} bytes) to Google Drive${folderId ? ' folder: ' + folderId : ''}`);
      
      const res = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
        },
        media: {
          body: fileStream,
        },
        fields: 'id,webViewLink',
      });
      
      this.logger.log(`Upload successful. File ID: ${res.data.id}`);
      
      return {
        driveFileId: res.data.id,
        driveLink: res.data.webViewLink,
      };
    } catch (error) {
      this.logger.error('Error uploading file to Google Drive:', error);
      throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
    }
  }

  async listFolders(): Promise<{ id: string, name: string }[]> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized');
      }
      
      const res = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id, name)',
      });
      
      return res.data.files.map(file => ({
        id: file.id,
        name: file.name,
      }));
    } catch (error) {
      this.logger.error('Error listing Google Drive folders:', error);
      throw new Error(`Failed to list Google Drive folders: ${error.message}`);
    }
  }

  async createFolder(folderName: string): Promise<{ id: string, name: string }> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not initialized');
      }
      
      const res = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id,name',
      });
      
      return {
        id: res.data.id,
        name: res.data.name,
      };
    } catch (error) {
      this.logger.error('Error creating Google Drive folder:', error);
      throw new Error(`Failed to create Google Drive folder: ${error.message}`);
    }
  }
}