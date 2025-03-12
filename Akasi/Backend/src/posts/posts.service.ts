import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async create(post: { admin_id: number; username: string; caption?: string }, files: Express.Multer.File[]) {
    this.logger.log(`Creating post with ${files?.length || 0} files`);
    
    // Start transaction to ensure data integrity
    return this.prisma.$transaction(async (tx) => {
      // Create post
      const createdPost = await tx.hSU_bulletin.create({
        data: {
          admin_id: post.admin_id,
          username: post.username,
          caption: post.caption || null,
        }
      });

      // Handle files if any
      if (files && files.length > 0) {
        // Log file sizes for debugging
        files.forEach(file => {
          this.logger.log(`Processing file: ${file.originalname}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        });

        // Create file entries
        await Promise.all(
          files.map(async (file) => {
            // Process video files differently if needed
            if (file.mimetype.startsWith('video/')) {
              this.logger.log(`Processing video: ${file.originalname}`);
            }

            return tx.hSU_bulletin_files.create({
              data: {
                post_id: createdPost.post_id,
                file_name: file.originalname,
                file_type: file.mimetype.split('/')[0],
                mime_type: file.mimetype,
                data: file.buffer,
              }
            });
          })
        );
      }

      // Return the created post with files
      return tx.hSU_bulletin.findUnique({
        where: { post_id: createdPost.post_id },
        include: {
          files: {
            select: {
              file_id: true,
              file_name: true,
              file_type: true,
              mime_type: true,
              // Don't include the actual file data in the response
              data: false
            }
          }
        }
      });
    });
  }

  async findAll() {
    return this.prisma.hSU_bulletin.findMany({
      include: {
        admin: true,
        files: {
          select: {
            file_id: true,
            file_name: true,
            file_type: true,
            mime_type: true
          }
        }
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.hSU_bulletin.findUnique({
      where: { post_id: id },
      include: {
        files: {
          select: {
            file_id: true,
            file_name: true,
            file_type: true,
            mime_type: true
            // Exclude binary data from detail view
          }
        }
      }
    });
  }

  async update(id: number, updateData: { caption?: string }, files?: Express.Multer.File[]) {
    return await this.prisma.$transaction(async (tx) => {
      // Update post details
      const updatedPost = await tx.hSU_bulletin.update({
        where: { post_id: id },
        data: {
          caption: updateData.caption
        }
      });

      // Handle new files if any
      if (files?.length) {
        for (const file of files) {
          await tx.hSU_bulletin_files.create({
            data: {
              post_id: id,
              file_name: file.originalname,
              file_type: file.mimetype.split('/')[0],
              mime_type: file.mimetype,
              data: file.buffer
            }
          });
        }
      }

      return updatedPost;
    });
  }

  async remove(id: number) {
  // Check if the post exists before deletion.
  const post = await this.prisma.hSU_bulletin.findUnique({
    where: { post_id: id }
  });
  if (!post) {
    // Log a warning and return silently to keep DELETE idempotent.
    console.warn(`Post with ID ${id} not found. Deletion skipped.`);
    return;
  }

  return this.prisma.$transaction(async (tx) => {
    // Delete associated files first if any.
    await tx.hSU_bulletin_files.deleteMany({
      where: { post_id: id }
    });
    // Then delete the post.
    return tx.hSU_bulletin.delete({
      where: { post_id: id }
    });
  });
}
}
