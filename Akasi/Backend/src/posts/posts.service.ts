import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async create(post: any) {
    console.log('Received post data:', post);
    // First create the post
    const newPost = await this.prisma.hSU_bulletin.create({
      data: {
        admin_id: parseInt(post.admin_id, 10), // Convert admin_id to integer
        username: post.username,
        caption: post.caption,
      }
    });

    // Upload files if any
    if (post.files?.length) {
      for (const file of post.files) {
        await this.storageService.uploadFile(file, newPost.post_id);
      }
    }

    // Return post with files
    return this.findOne(newPost.post_id);
  }

  async findAll() {
    return this.prisma.hSU_bulletin.findMany({
      include: {
        admin: true // Include the related admin data
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.hSU_bulletin.findUnique({
      where: { post_id: id },
      include: {
        files: true
      }
    });
  }

  async update(id: number, updatePost: any) {
    return this.prisma.hSU_bulletin.update({
      where: { post_id: id },
      data: updatePost,
    });
  }

  
  async remove(id: number) {
    const post = await this.prisma.hSU_bulletin.findUnique({
      where: { post_id: id },
      include: { files: true }
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Delete files from Google Drive first
    if (post.files?.length > 0) {
      console.log(`Deleting files for post_id: ${id}`);
      console.log(`Found ${post.files.length} files to delete`);
      for (const file of post.files) {
        await this.storageService.deleteFile(file.file_path);
      }
    }

    // Delete post and files in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Delete files first
      const deletedFiles = await tx.hSU_bulletin_files.deleteMany({
        where: { post_id: id }
      });
      console.log(`Deleted ${deletedFiles.count} files from database`);

      // Then delete the post
      return await tx.hSU_bulletin.delete({
        where: { post_id: id }
      });
    });
  }
}