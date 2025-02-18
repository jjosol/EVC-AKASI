
import { Injectable } from '@nestjs/common';
import { driveService } from '../config/drive.config';
import { PrismaService } from '../prisma.service';
import { Readable } from 'stream';  // Add this line

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}
  private FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

  async uploadFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
  }, postId: number) {
    try {
      const fileMetadata = {
        name: file.originalname,
        parents: [this.FOLDER_ID]
      };

      // Convert buffer to stream
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null);

      const media = {
        mimeType: file.mimetype,
        body: fileStream
      };

      const response = await driveService.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });

      // Save file metadata to database
      const fileRecord = await this.prisma.hSU_bulletin_files.create({
        data: {
          post_id: postId,
          file_name: file.originalname,
          file_type: file.mimetype.split('/')[0], // 'image', 'video', etc
          file_path: response.data.webViewLink
        }
      });

      return fileRecord;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

   async deleteFile(filePath: string) {
    try {
      if (!filePath) {
        console.warn('No file path provided for deletion');
        return;
      }

      const fileId = this.extractFileId(filePath);
      if (!fileId) {
        console.warn('Could not extract file ID from path:', filePath);
        return;
      }

      await driveService.files.delete({
        fileId: fileId
      });

      console.log(`Successfully deleted file ${fileId} from Drive`);
    } catch (error) {
      console.error('Failed to delete file from Drive:', error);
      // Don't throw error to allow cascade delete to continue
    }
  }

  private extractFileId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }
}
