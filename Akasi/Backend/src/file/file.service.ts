import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {}

  async getFileById(fileId: number) {
    try {
      this.logger.log(`Looking up file with ID: ${fileId}`);

      // First check hsu_bulletin_files table
      const bulletinFile = await this.prisma.hsu_bulletin_files.findUnique({
        where: { file_id: fileId }
      });

      if (bulletinFile) {
        this.logger.log(`Found bulletin file: ${bulletinFile.file_name}`);
        return bulletinFile;
      }

      // If not found, check if it's another file type
      // Here we can extend to check other tables like prescription files, patient files, etc.
      this.logger.warn(`File with ID ${fileId} not found in hsu_bulletin_files`);
      
      // Try to find file in other tables here...
      // Example:
      // const prescriptionFile = await this.prisma.prescription.findFirst({
      //   where: { prescription_id: fileId }
      // });
      // if (prescriptionFile) return prescriptionFile;

      throw new NotFoundException(`File with ID ${fileId} not found in any table`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error retrieving file with ID ${fileId}:`, error);
      throw new NotFoundException(`Error retrieving file: ${error.message}`);
    }
  }

  async cleanOrphanedFiles() {
    return await this.prisma.hsu_bulletin_files.deleteMany({
      where: { bulletin: null }
    });
  }

  getFullUploadPath(relativePath: string): string {
    // Handle both formats: with and without the school year prefix
    if (!relativePath.startsWith('2024-2025')) {
      // If path doesn't already have the school year, prepend it
      relativePath = path.join('2024-2025', relativePath);
    }
    return path.join(this.uploadDir, relativePath);
  }
}