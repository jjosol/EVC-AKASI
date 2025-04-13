import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async create(post: { nurse_id: number; username: string; caption?: string }, files: Express.Multer.File[]) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Create post first
        const newPost = await tx.hsu_bulletin.create({
          data: {
            nurse_id: Number(post.nurse_id),
            username: post.username,
            caption: post.caption || ""
          }
        });

        // Handle files if any
        if (files?.length) {
          const filePromises = files.map(file => 
            this.storageService.uploadFile(file, newPost.post_id)
          );
          await Promise.all(filePromises);
        }

        // Return complete post with files and nurse information
        return await tx.hsu_bulletin.findUnique({
          where: { post_id: newPost.post_id },
          include: {
            files: {
              select: {
                file_id: true,
                file_name: true,
                file_path: true,
                mime_type: true,
                file_size: true
              }
            },
            nurse: {
              select: {
                name: true
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('Post creation failed:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.hsu_bulletin.findMany({
      include: {
        nurse: {
          select: {
            name: true
          }
        },
        files: {
          select: {
            file_id: true,
            file_name: true,
            file_path: true,
            mime_type: true,
            file_size: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.hsu_bulletin.findUnique({
      where: { post_id: id },
      include: {
        nurse: {
          select: {
            name: true
          }
        },
        files: {
          select: {
            file_id: true,
            file_name: true,
            file_path: true,
            mime_type: true,
            file_size: true,
            created_at: true
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Add file_type property based on mime_type for each file
    const enhancedPost = {
      ...post,
      files: post.files.map(file => ({
        ...file,
        file_type: this.determineFileType(file.mime_type)
      }))
    };

    return enhancedPost;
  }

  async update(id: number, updateData: { caption?: string }, files?: Express.Multer.File[], existingFileIds?: number[]) {
    return await this.prisma.$transaction(async (tx) => {
      // Update post details
      const updatedPost = await tx.hsu_bulletin.update({
        where: { post_id: id },
        data: {
          caption: updateData.caption
        }
      });

      // If existingFileIds is provided, delete files that are no longer associated
      if (existingFileIds !== undefined) { // Changed from 'if (existingFileIds)' to handle empty arrays properly
        // Find files that are currently associated but not in existingFileIds
        const currentFiles = await tx.hsu_bulletin_files.findMany({
          where: { post_id: id },
          select: { file_id: true, file_path: true }
        });
        
        const currentFileIds = currentFiles.map(file => file.file_id);
        const filesToDelete = currentFileIds.filter(fileId => !existingFileIds.includes(fileId));
        
        if (filesToDelete.length > 0) {
          // Delete files from storage and database
          for (const fileId of filesToDelete) {
            await this.storageService.deleteFile(fileId);
          }
        }
      }

      // Handle new files if any
      if (files?.length) {
        const filePromises = files.map(file => 
          this.storageService.uploadFile(file, id)
        );
        await Promise.all(filePromises);
      }

      // Return complete updated post with files and nurse information
      const post = await tx.hsu_bulletin.findUnique({
        where: { post_id: id },
        include: {
          files: {
            select: {
              file_id: true,
              file_name: true,
              file_path: true,
              mime_type: true,
              file_size: true
            }
          },
          nurse: {
            select: {
              name: true
            }
          }
        }
      });

      // Add file_type property based on mime_type for each file
      const enhancedPost = {
        ...post,
        files: post.files.map(file => ({
          ...file,
          file_type: this.determineFileType(file.mime_type)
        }))
      };

      return enhancedPost;
    });
  }

  async remove(id: number) {
    // Check if the post exists before deletion.
    const post = await this.prisma.hsu_bulletin.findUnique({
      where: { post_id: id },
      include: {
        files: {
          select: { file_id: true }
        }
      }
    });
    
    if (!post) {
      // Log a warning and return silently to keep DELETE idempotent.
      console.warn(`Post with ID ${id} not found. Deletion skipped.`);
      return;
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete associated files first if any
      for (const file of post.files) {
        await this.storageService.deleteFile(file.file_id);
      }
      
      // Then delete the post
      return tx.hsu_bulletin.delete({
        where: { post_id: id }
      });
    });
  }

  // Helper method to determine file type based on MIME type
  private determineFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else if (
      mimeType === 'application/vnd.ms-excel' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel.sheet.macroEnabled.12'
    ) {
      return 'excel';
    } else if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return 'word';
    } else {
      return 'document';
    }
  }
}