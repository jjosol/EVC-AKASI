import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileService {
  private driveService;

  constructor(
    private prisma: PrismaService
  ) {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credentialsPath) {
        throw new Error('Google credentials path not found in environment variables');
      }

      // Read credentials from file
      const credentials = JSON.parse(
        readFileSync(join(process.cwd(), credentialsPath), 'utf-8')
      );

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.driveService = google.drive({ version: 'v3', auth });
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      // Will handle errors in methods that need Drive service
    }
  }

  async getFileById(fileId: number) {
    try {
      return await this.prisma.hSU_bulletin_files.findUnique({
        where: { file_id: fileId },
        include: { bulletin: true }
      });
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }
  }

  async getFileStream(filePath: string): Promise<Readable> {
    if (!this.driveService) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      const fileId = this.extractFileId(filePath);
      if (!fileId) {
        throw new Error('Invalid file path');
      }

      const response = await this.driveService.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return response.data as Readable;
    } catch (error) {
      console.error('Error getting file stream:', error);
      throw new NotFoundException('File not found or inaccessible');
    }
  }

  async cleanOrphanedFiles() {
    try {
      const deletedFiles = await this.prisma.hSU_bulletin_files.deleteMany({
        where: {
          bulletin: null // This will delete files where the bulletin relation doesn't exist
        }
      });
      
      console.log(`Cleaned ${deletedFiles.count} orphaned files`);
      return deletedFiles.count;
    } catch (error) {
      console.error('Error cleaning orphaned files:', error);
      throw new Error('Failed to clean orphaned files');
    }
  }

  private extractFileId(url: string): string | null {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }
}