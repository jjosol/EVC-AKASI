import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FileService {
  constructor(private prisma: PrismaService) {}

  async getFileById(fileId: number) {
    const file = await this.prisma.hSU_bulletin_files.findUnique({
      where: { file_id: fileId }
    });
    if (!file) throw new NotFoundException();
    return file;
  }

  async cleanOrphanedFiles() {
    return await this.prisma.hSU_bulletin_files.deleteMany({
      where: { bulletin: null }
    });
  }
}