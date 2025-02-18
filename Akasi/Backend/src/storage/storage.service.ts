import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
  }, postId: number) {
    return await this.prisma.hSU_bulletin_files.create({
      data: {
        post_id: postId,
        file_name: file.originalname,
        file_type: file.mimetype.split('/')[0],
        mime_type: file.mimetype,
        data: file.buffer
      }
    });
  }

  async deleteFile(fileId: number) {
    return await this.prisma.hSU_bulletin_files.delete({
      where: { file_id: fileId }
    });
  }
}